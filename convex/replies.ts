import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
