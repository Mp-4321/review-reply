import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const MIN_INTERVAL_MS = 10  * 60 * 1000  // 10 minutes
const MAX_INTERVAL_MS = 180 * 60 * 1000  // 180 minutes
const MAX_PER_DAY     = 5

function autoQueueDelay(): number {
  return (20 + Math.floor(Math.random() * 161)) * 60 * 1000
}

export const listDrafts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) return []

    return ctx.db
      .query('replies')
      .withIndex('by_user_and_status', q =>
        q.eq('userId', user._id).eq('status', 'draft'),
      )
      .order('desc')
      .take(50)
  },
})

export const listDraftsWithReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) return []

    const [drafts, queued, approved, needsReview] = await Promise.all([
      ctx.db
        .query('replies')
        .withIndex('by_user_and_status', q => q.eq('userId', user._id).eq('status', 'draft'))
        .order('desc')
        .take(50),
      ctx.db
        .query('replies')
        .withIndex('by_user_and_status', q => q.eq('userId', user._id).eq('status', 'queued'))
        .order('asc')
        .take(50),
      ctx.db
        .query('replies')
        .withIndex('by_user_and_status', q => q.eq('userId', user._id).eq('status', 'approved'))
        .order('asc')
        .take(50),
      ctx.db
        .query('replies')
        .withIndex('by_user_and_status', q => q.eq('userId', user._id).eq('status', 'needs_review'))
        .order('desc')
        .take(50),
    ])

    const all = [...drafts, ...queued, ...approved, ...needsReview]
    const withReviews = await Promise.all(
      all.map(async reply => {
        const review = await ctx.db.get(reply.reviewId)
        return review ? { reply, review } : null
      }),
    )

    return withReviews.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})

export const save = mutation({
  args: {
    reviewId: v.id('reviews'),
    draft:    v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) throw new Error('User not found')

    const workflowSettings = await ctx.db
      .query('workflowSettings')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .unique()

    const autoPublish = workflowSettings?.autoPublishEnabled ?? false
    const now = Date.now()

    const replyId = await ctx.db.insert('replies', {
      userId:      user._id,
      reviewId:    args.reviewId,
      draft:       args.draft,
      status:      autoPublish ? 'queued' : 'draft',
      generatedAt: now,
      ...(autoPublish ? { scheduledAt: now + autoQueueDelay() } : {}),
    })

    return replyId
  },
})

export const approve = mutation({
  args: { replyId: v.id('replies') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const reply = await ctx.db.get(args.replyId)
    if (!reply) throw new Error('Reply not found')

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user || reply.userId !== user._id) throw new Error('Unauthorized')

    await ctx.db.patch(args.replyId, { status: 'approved' })
  },
})

export const updateDraft = mutation({
  args: { replyId: v.id('replies'), draft: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const reply = await ctx.db.get(args.replyId)
    if (!reply) throw new Error('Reply not found')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user || reply.userId !== user._id) throw new Error('Unauthorized')
    await ctx.db.patch(args.replyId, { draft: args.draft, status: 'draft' })
  },
})

export const queueReplies = mutation({
  args: {
    replyIds: v.array(v.id('replies')),
    startAt:  v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) throw new Error('User not found')

    const startOfTodayMs = new Date().setHours(0, 0, 0, 0)
    const alreadyQueued = await ctx.db
      .query('replies')
      .withIndex('by_user_and_status', q => q.eq('userId', user._id).eq('status', 'queued'))
      .take(100)
    const scheduledTodayCount = alreadyQueued.filter(
      r => r.scheduledAt !== undefined && r.scheduledAt >= startOfTodayMs,
    ).length
    const slotsRemaining = Math.max(0, MAX_PER_DAY - scheduledTodayCount)

    let scheduledAt = args.startAt ?? Date.now()
    let queued = 0
    for (const replyId of args.replyIds) {
      if (queued >= slotsRemaining) break
      const reply = await ctx.db.get(replyId)
      if (!reply || reply.userId !== user._id) continue
      if (reply.status !== 'draft') continue

      await ctx.db.patch(replyId, { status: 'queued', scheduledAt })
      const interval = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS)
      scheduledAt += interval
      queued++
    }
  },
})

export const removeFromQueue = mutation({
  args: { replyId: v.id('replies') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const reply = await ctx.db.get(args.replyId)
    if (!reply) throw new Error('Reply not found')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user || reply.userId !== user._id) throw new Error('Unauthorized')
    await ctx.db.patch(args.replyId, { status: 'draft', scheduledAt: undefined })
  },
})

export const discardDrafts = mutation({
  args: { replyIds: v.array(v.id('replies')) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) throw new Error('User not found')

    for (const replyId of args.replyIds) {
      const reply = await ctx.db.get(replyId)
      if (!reply || reply.userId !== user._id) continue
      await ctx.db.patch(replyId, { status: 'rejected' })
    }
  },
})

export const markPublished = mutation({
  args: { replyId: v.id('replies') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const reply = await ctx.db.get(args.replyId)
    if (!reply) throw new Error('Reply not found')

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user || reply.userId !== user._id) throw new Error('Unauthorized')

    await ctx.db.patch(args.replyId, {
      status:      'published',
      publishedAt: Date.now(),
    })
    await ctx.db.patch(reply.reviewId, { status: 'replied' })
  },
})
