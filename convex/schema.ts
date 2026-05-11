import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email:           v.optional(v.string()),
    name:            v.optional(v.string()),
  }).index('by_token', ['tokenIdentifier']),

  locations: defineTable({
    userId:           v.id('users'),
    googleLocationId: v.string(),   // "accounts/xxx/locations/yyy"
    accountId:        v.string(),
    displayName:      v.string(),
    address:          v.optional(v.string()),
    syncedAt:         v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_google_id', ['userId', 'googleLocationId']),

  reviews: defineTable({
    userId:          v.id('users'),
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
    status:          v.union(
      v.literal('pending'),
      v.literal('replied'),
      v.literal('ignored'),
    ),
  })
    .index('by_user', ['userId'])
    .index('by_location', ['locationId'])
    .index('by_user_and_status', ['userId', 'status'])
    .index('by_user_and_google_id', ['userId', 'googleReviewId']),

  aiSettings: defineTable({
    userId:              v.id('users'),
    businessDescription: v.optional(v.string()),
    tone:                v.optional(v.union(
      v.literal('professional'),
      v.literal('friendly'),
      v.literal('warm'),
      v.literal('casual'),
      v.literal('concise'),
    )),
    replyLength:         v.optional(v.union(
      v.literal('short'),
      v.literal('balanced'),
      v.literal('detailed'),
    )),
    signature:           v.optional(v.string()),
    customInstructions:  v.optional(v.string()),
  }).index('by_user', ['userId']),

  replies: defineTable({
    userId:      v.id('users'),
    reviewId:    v.id('reviews'),
    draft:       v.string(),
    status:      v.union(
      v.literal('draft'),
      v.literal('approved'),
      v.literal('published'),
      v.literal('rejected'),
    ),
    generatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index('by_review', ['reviewId'])
    .index('by_user', ['userId'])
    .index('by_user_and_status', ['userId', 'status']),
})
