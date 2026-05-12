import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

const SIMILARITY_THRESHOLD = 0.6
const MAX_ATTEMPTS = 3

// ─── Similarity ───────────────────────────────────────────────────────────────

function jaccardSimilarity(a: string, b: string): number {
  const tokenize = (s: string) => new Set(s.toLowerCase().match(/\w+/g) ?? [])
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 && setB.size === 0) return 1
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  return intersection / (setA.size + setB.size - intersection)
}

function maxSimilarity(candidate: string, corpus: string[]): number {
  if (corpus.length === 0) return 0
  return Math.max(...corpus.map(t => jaccardSimilarity(candidate, t)))
}

// ─── AI regeneration (fetch — no SDK, no "use node") ─────────────────────────

type AISettings = {
  tone?:                string
  replyLength?:         string
  businessDescription?: string
  signature?:           string
  customInstructions?:  string
} | null

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: 'Use a professional and polished tone.',
  friendly:     'Use a friendly and approachable tone.',
  warm:         'Use a warm and caring tone.',
  casual:       'Use a casual and conversational tone.',
  concise:      'Use a concise and direct tone — 2–3 lines max.',
}
const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short:    'Keep the reply to 1–2 sentences.',
  balanced: 'Keep the reply to 3–4 sentences.',
  detailed: 'Write a full paragraph reply (5–7 sentences).',
}

async function generateVariedReply(
  reviewText: string,
  aiSettings: AISettings,
  attempt: number,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const sections: string[] = [
    `You are a customer care expert crafting replies to Google reviews.
Reply in the same language as the review. Be personalized, not generic.
No markdown. Reply text only.`,
  ]

  const toneKey = aiSettings?.tone ?? 'professional'
  if (TONE_INSTRUCTIONS[toneKey]) sections.push(`Tone: ${TONE_INSTRUCTIONS[toneKey]}`)

  const lengthKey = aiSettings?.replyLength ?? 'balanced'
  if (LENGTH_INSTRUCTIONS[lengthKey]) sections.push(`Length: ${LENGTH_INSTRUCTIONS[lengthKey]}`)

  if (aiSettings?.businessDescription?.trim())
    sections.push(`Business context: ${aiSettings.businessDescription.trim()}`)
  if (aiSettings?.customInstructions?.trim())
    sections.push(`Additional instructions:\n${aiSettings.customInstructions.trim()}`)
  if (aiSettings?.signature?.trim())
    sections.push(`Append this signature on a new line: ${aiSettings.signature.trim()}`)

  sections.push(
    `IMPORTANT (attempt ${attempt} of ${MAX_ATTEMPTS}): This reply is too similar to recently published replies. ` +
    `Generate a response with significantly different phrasing, sentence structure, and opening line. ` +
    `Vary vocabulary and approach noticeably.`,
  )

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system:     sections.join('\n\n'),
        messages:   [{ role: 'user', content: `Review:\n"${reviewText.trim()}"\n\nWrite the reply.` }],
      }),
    })
    if (!res.ok) return null
    const json = await res.json() as { content?: Array<{ type: string; text: string }> }
    return json.content?.filter(b => b.type === 'text').map(b => b.text).join('') ?? null
  } catch {
    return null
  }
}

// ─── Internal query ───────────────────────────────────────────────────────────

export const getCheckData = internalQuery({
  args: { replyId: v.id('replies') },
  handler: async (ctx, { replyId }) => {
    const reply = await ctx.db.get(replyId)
    if (!reply || reply.status !== 'queued') return null

    const review = await ctx.db.get(reply.reviewId)
    if (!review) return null

    const aiSettings = await ctx.db
      .query('aiSettings')
      .withIndex('by_user', q => q.eq('userId', reply.userId))
      .unique()

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const published = await ctx.db
      .query('replies')
      .withIndex('by_user_and_status', q =>
        q.eq('userId', reply.userId).eq('status', 'published'),
      )
      .take(200)

    const recentTexts = published
      .filter(r => r.publishedAt !== undefined && r.publishedAt >= thirtyDaysAgo)
      .map(r => r.draft)

    return {
      replyText:  reply.draft,
      reviewText: review.comment ?? '',
      reviewId:   review._id,
      userId:     reply.userId,
      recentTexts,
      aiSettings: aiSettings
        ? {
            tone:                aiSettings.tone,
            replyLength:         aiSettings.replyLength,
            businessDescription: aiSettings.businessDescription,
            signature:           aiSettings.signature,
            customInstructions:  aiSettings.customInstructions,
          }
        : null,
    }
  },
})

// ─── Internal mutations ───────────────────────────────────────────────────────

export const updateReplyText = internalMutation({
  args: { replyId: v.id('replies'), text: v.string() },
  handler: async (ctx, { replyId, text }) => {
    await ctx.db.patch(replyId, { draft: text })
  },
})

export const publishReply = internalMutation({
  args: {
    replyId:  v.id('replies'),
    reviewId: v.id('reviews'),
    userId:   v.id('users'),
    score:    v.number(),
    attempts: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.patch(args.replyId,  { status: 'published', publishedAt: now })
    await ctx.db.patch(args.reviewId, { status: 'replied' })
    await ctx.db.insert('similarityChecks', {
      replyId:   args.replyId,
      userId:    args.userId,
      attempts:  args.attempts,
      maxScore:  args.score,
      outcome:   'published',
      checkedAt: now,
    })
  },
})

export const markNeedsReview = internalMutation({
  args: {
    replyId:  v.id('replies'),
    userId:   v.id('users'),
    score:    v.number(),
    attempts: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.patch(args.replyId, { status: 'needs_review' })
    await ctx.db.insert('similarityChecks', {
      replyId:   args.replyId,
      userId:    args.userId,
      attempts:  args.attempts,
      maxScore:  args.score,
      outcome:   'needs_review',
      checkedAt: now,
    })
  },
})

// Finds queued replies whose scheduledAt has passed and schedules checkAndPublish for each.
// Processes up to 10 per cron tick to stay within transaction limits.
export const processQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const queued = await ctx.db
      .query('replies')
      .withIndex('by_status', q => q.eq('status', 'queued'))
      .take(50)

    const due = queued
      .filter(r => r.scheduledAt !== undefined && r.scheduledAt <= now)
      .slice(0, 10)

    for (const reply of due) {
      await ctx.scheduler.runAfter(0, internal.publish.checkAndPublish, { replyId: reply._id })
    }

    return due.length
  },
})

// ─── Internal action ──────────────────────────────────────────────────────────

export const checkAndPublish = internalAction({
  args: { replyId: v.id('replies') },
  handler: async (ctx, { replyId }) => {
    const data: {
      replyText:  string
      reviewText: string
      reviewId:   Id<'reviews'>
      userId:     Id<'users'>
      recentTexts: string[]
      aiSettings: AISettings
    } | null = await ctx.runQuery(internal.publish.getCheckData, { replyId })

    if (!data) return

    const { reviewText, reviewId, userId, recentTexts, aiSettings } = data
    let currentText = data.replyText
    let attempts = 0
    let score = maxSimilarity(currentText, recentTexts)

    while (score > SIMILARITY_THRESHOLD && attempts < MAX_ATTEMPTS) {
      attempts++
      const newText = await generateVariedReply(reviewText, aiSettings, attempts)
      if (newText) {
        await ctx.runMutation(internal.publish.updateReplyText, { replyId, text: newText })
        currentText = newText
      }
      score = maxSimilarity(currentText, recentTexts)
    }

    if (score > SIMILARITY_THRESHOLD) {
      await ctx.runMutation(internal.publish.markNeedsReview, {
        replyId, userId, score, attempts,
      })
    } else {
      await ctx.runMutation(internal.publish.publishReply, {
        replyId, reviewId, userId, score, attempts,
      })
    }
  },
})
