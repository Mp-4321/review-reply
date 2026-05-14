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
      .query('workflowSettings')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .unique()
  },
})

export const save = mutation({
  args: {
    autoPublishEnabled:   v.boolean(),
    emailApprovalEnabled: v.boolean(),
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
      .query('workflowSettings')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert('workflowSettings', { userId: user._id, ...args })
    }
  },
})
