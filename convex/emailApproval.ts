import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'

function autoQueueDelay() {
  return (20 + Math.floor(Math.random() * 161)) * 60 * 1000
}

async function getAuthUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return ctx.db
    .query('users')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique()
}

// Generate and store a one-time approval token on the reply
export const setToken = mutation({
  args: { replyId: v.id('replies') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (!user) throw new Error('Unauthenticated')
    const reply = await ctx.db.get(args.replyId)
    if (!reply || reply.userId !== user._id) throw new Error('Not found')
    if (reply.status !== 'draft') throw new Error('Reply is not a draft')

    const token = crypto.randomUUID()
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    await ctx.db.patch(args.replyId, {
      approvalToken:          token,
      approvalTokenExpiresAt: expiresAt,
    })
    return token
  },
})

// Read review + reply + user email for building the approval email
export const getEmailData = query({
  args: { replyId: v.id('replies') },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    if (!user) return null
    const reply = await ctx.db.get(args.replyId)
    if (!reply || reply.userId !== user._id) return null
    const review = await ctx.db.get(reply.reviewId)
    if (!review) return null
    return { reply, review, userEmail: user.email ?? null }
  },
})

// Approve via email link — no Clerk auth, token is the auth
export const approveByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const reply = await ctx.db
      .query('replies')
      .withIndex('by_approval_token', q => q.eq('approvalToken', args.token))
      .unique()

    if (!reply)                                           return { ok: false, reason: 'not_found' }
    if (reply.status !== 'draft')                         return { ok: false, reason: 'already_actioned' }
    if ((reply.approvalTokenExpiresAt ?? 0) < Date.now()) return { ok: false, reason: 'expired' }

    await ctx.db.patch(reply._id, {
      status:                 'queued',
      scheduledAt:            Date.now() + autoQueueDelay(),
      approvalToken:          undefined,
      approvalTokenExpiresAt: undefined,
    })
    return { ok: true }
  },
})

// Reject via email link — no Clerk auth, token is the auth
export const rejectByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const reply = await ctx.db
      .query('replies')
      .withIndex('by_approval_token', q => q.eq('approvalToken', args.token))
      .unique()

    if (!reply)                                           return { ok: false, reason: 'not_found' }
    if (reply.status !== 'draft')                         return { ok: false, reason: 'already_actioned' }
    if ((reply.approvalTokenExpiresAt ?? 0) < Date.now()) return { ok: false, reason: 'expired' }

    await ctx.db.patch(reply._id, {
      status:                 'rejected',
      approvalToken:          undefined,
      approvalTokenExpiresAt: undefined,
    })
    return { ok: true }
  },
})
