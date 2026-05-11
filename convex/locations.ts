import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
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
      .query('locations')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .take(20)
  },
})

export const upsert = mutation({
  args: {
    googleLocationId: v.string(),
    accountId:        v.string(),
    displayName:      v.string(),
    address:          v.optional(v.string()),
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
      .query('locations')
      .withIndex('by_user_and_google_id', q =>
        q.eq('userId', user._id).eq('googleLocationId', args.googleLocationId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        address:     args.address,
        syncedAt:    Date.now(),
      })
      return existing._id
    }

    return ctx.db.insert('locations', {
      userId:           user._id,
      googleLocationId: args.googleLocationId,
      accountId:        args.accountId,
      displayName:      args.displayName,
      address:          args.address,
      syncedAt:         Date.now(),
    })
  },
})
