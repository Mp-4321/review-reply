import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) return null
    return ctx.db
      .query('aiSettings')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .unique()
  },
})

export const save = mutation({
  args: {
    businessDescription: v.optional(v.string()),
    tone:                v.optional(v.union(
      v.literal('professional'),
      v.literal('friendly'),
      v.literal('warm'),
      v.literal('casual'),
      v.literal('formal'),
    )),
    replyLength:         v.optional(v.union(
      v.literal('short'),
      v.literal('balanced'),
      v.literal('detailed'),
    )),
    signature:           v.optional(v.string()),
    customInstructions:  v.optional(v.string()),
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
      .query('aiSettings')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert('aiSettings', { userId: user._id, ...args })
    }
  },
})
