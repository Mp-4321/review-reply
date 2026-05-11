import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
  },
})

export const upsert = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email,
        name:  identity.name,
      })
      return existing._id
    }

    return ctx.db.insert('users', {
      tokenIdentifier: identity.tokenIdentifier,
      email:           identity.email,
      name:            identity.name,
    })
  },
})
