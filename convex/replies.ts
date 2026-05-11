import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const MIN_INTERVAL_MS = 12 * 60 * 1000
const MAX_INTERVAL_MS = 27 * 60 * 1000

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

    const [drafts, queued] = await Promise.all([
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
    ])

    const all = [...drafts, ...queued]
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

    return ctx.db.insert('replies', {
      userId:      user._id,
      reviewId:    args.reviewId,
      draft:       args.draft,
      status:      'draft',
      generatedAt: Date.now(),
    })
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
  args: { replyIds: v.array(v.id('replies')) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) throw new Error('User not found')

    let scheduledAt = Date.now()
    for (const replyId of args.replyIds) {
      const reply = await ctx.db.get(replyId)
      if (!reply || reply.userId !== user._id) continue
      if (reply.status !== 'draft') continue

      await ctx.db.patch(replyId, { status: 'queued', scheduledAt })
      const interval = MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS)
      scheduledAt += interval
    }
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
