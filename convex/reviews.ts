import { mutation, query, QueryCtx } from './_generated/server'
import { v } from 'convex/values'

async function requireUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  const user = await ctx.db
    .query('users')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique()
  if (!user) throw new Error('User not found')
  return user
}

export const list = query({
  args: {
    locationId: v.optional(v.id('locations')),
    status:     v.optional(v.union(
      v.literal('pending'),
      v.literal('replied'),
      v.literal('ignored'),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) return []

    const n = args.limit ?? 50

    if (args.locationId) {
      return ctx.db
        .query('reviews')
        .withIndex('by_location', q => q.eq('locationId', args.locationId!))
        .order('desc')
        .take(n)
    }

    if (args.status) {
      return ctx.db
        .query('reviews')
        .withIndex('by_user_and_status', q =>
          q.eq('userId', user._id).eq('status', args.status!),
        )
        .order('desc')
        .take(n)
    }

    return ctx.db
      .query('reviews')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .order('desc')
      .take(n)
  },
})

export const upsert = mutation({
  args: {
    locationId:      v.id('locations'),
    googleReviewId:  v.string(),
    reviewerName:    v.string(),
    starRating:      v.union(
      v.literal('ONE'),
      v.literal('TWO'),
      v.literal('THREE'),
      v.literal('FOUR'),
      v.literal('FIVE'),
    ),
    comment:         v.optional(v.string()),
    createTime:      v.string(),
    updateTime:      v.string(),
    replyComment:    v.optional(v.string()),
    replyUpdateTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) throw new Error('User not found')

    const existing = await ctx.db
      .query('reviews')
      .withIndex('by_user_and_google_id', q =>
        q.eq('userId', user._id).eq('googleReviewId', args.googleReviewId),
      )
      .unique()

    const status = args.replyComment ? 'replied' : 'pending'

    if (existing) {
      await ctx.db.patch(existing._id, {
        reviewerName:    args.reviewerName,
        starRating:      args.starRating,
        comment:         args.comment,
        updateTime:      args.updateTime,
        replyComment:    args.replyComment,
        replyUpdateTime: args.replyUpdateTime,
        status,
      })
      return existing._id
    }

    return ctx.db.insert('reviews', {
      userId:          user._id,
      locationId:      args.locationId,
      googleReviewId:  args.googleReviewId,
      reviewerName:    args.reviewerName,
      starRating:      args.starRating,
      comment:         args.comment,
      createTime:      args.createTime,
      updateTime:      args.updateTime,
      replyComment:    args.replyComment,
      replyUpdateTime: args.replyUpdateTime,
      status,
    })
  },
})
