import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

const SIMILARITY_THRESHOLD = 0.6
const MAX_ATTEMPTS = 3

// ─── Preprocessing & similarity ───────────────────────────────────────────────

const STOPWORDS = new Set([
  // English
  'a','an','the','and','or','but','if','then','so','as','at','by','for',
  'in','of','on','to','up','it','is','be','do','no','not','we','i','you',
  'he','she','they','our','your','his','her','their','my','me','him',
  'us','them','its','this','that','with','from','are','was','were','been',
  'have','has','had','will','would','could','should','may','might','can',
  'did','does','also','just','more','very','all','any','some','here','there',
  'when','where','which','who','than','into','out','about','over','after',
  'being','much','how','what','each','both','few','those','too','own','same',
  // Italian
  'il','lo','la','le','gli','i','un','una','uno','di','da','in','su','per',
  'con','al','del','della','dei','delle','degli','si','non','ci','ne','vi',
  'mi','ti','se','ma','e','o','a','ha','ho','hai','sono','era','erano',
  'che','questo','questa','questi','queste','molto','anche','tutto','ogni',
  'suo','sua','suoi','sue','loro','lui','lei','noi','voi','qui',
])

type AISettings = {
  tone?:                string
  replyLength?:         string
  businessDescription?: string
  signature?:           string
  customInstructions?:  string
} | null

function buildStopTokens(aiSettings: AISettings): Set<string> {
  const extra = new Set<string>()
  const bizWords = (aiSettings?.businessDescription ?? '').toLowerCase().match(/\w+/g) ?? []
  for (const w of bizWords) if (w.length > 2) extra.add(w)
  const sigWords = (aiSettings?.signature ?? '').toLowerCase().match(/\w+/g) ?? []
  for (const w of sigWords) if (w.length > 2) extra.add(w)
  return extra
}

function buildTokenSet(text: string, stopTokens: Set<string>): Set<string> {
  const tokens = text.toLowerCase().match(/\w+/g) ?? []
  return new Set(tokens.filter(t => t.length > 2 && !STOPWORDS.has(t) && !stopTokens.has(t)))
}

function jaccardSets(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  return intersection / (setA.size + setB.size - intersection)
}

function maxSimilarity(candidateSet: Set<string>, corpusSets: Set<string>[]): number {
  if (corpusSets.length === 0) return 0
  return Math.max(...corpusSets.map(s => jaccardSets(candidateSet, s)))
}

function adaptiveThreshold(tokenCount: number): number {
  return tokenCount < 12 ? 0.75 : SIMILARITY_THRESHOLD
}

function randomMs(minMin: number, maxMin: number): number {
  return (Math.floor(Math.random() * (maxMin - minMin + 1)) + minMin) * 60 * 1000
}

// ─── AI regeneration (fetch — no SDK, no "use node") ─────────────────────────

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

    const now           = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const oneHourAgo    = now - 60 * 60 * 1000
    const oneDayAgo     = now - 24 * 60 * 60 * 1000

    // ── Per-location similarity scope ──────────────────────────────────────
    const locationReviews = await ctx.db
      .query('reviews')
      .withIndex('by_location', q => q.eq('locationId', review.locationId))
      .take(500)
    const locationReviewIds = new Set(locationReviews.map(r => r._id as string))

    // Rate limits: per-user (Google API limits apply across the account)
    const allPublished = await ctx.db
      .query('replies')
      .withIndex('by_user_and_status', q =>
        q.eq('userId', reply.userId).eq('status', 'published'),
      )
      .take(200)

    const hourlyCount = allPublished
      .filter(r => r.publishedAt !== undefined && r.publishedAt >= oneHourAgo)
      .length

    const dailyPublished = allPublished
      .filter(r => r.publishedAt !== undefined && r.publishedAt >= oneDayAgo)
      .sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0))
    const dailyCount    = dailyPublished.length
    const oldestDailyAt = dailyPublished[0]?.publishedAt

    const lastPublishedAt = allPublished.reduce<number | undefined>(
      (max, r) => r.publishedAt !== undefined ? Math.max(max ?? 0, r.publishedAt) : max,
      undefined,
    )

    // ── Similarity corpus: published (last 30 days) + queued — per location ─
    const locationPublishedTexts = allPublished
      .filter(r =>
        r.publishedAt !== undefined &&
        r.publishedAt >= thirtyDaysAgo &&
        locationReviewIds.has(r.reviewId as string),
      )
      .map(r => r.draft)

    const allQueued = await ctx.db
      .query('replies')
      .withIndex('by_user_and_status', q =>
        q.eq('userId', reply.userId).eq('status', 'queued'),
      )
      .take(200)

    const locationQueuedTexts = allQueued
      .filter(r => r._id !== replyId && locationReviewIds.has(r.reviewId as string))
      .map(r => r.draft)

    const corpusTexts = [...locationPublishedTexts, ...locationQueuedTexts]

    return {
      replyText:      reply.draft,
      reviewText:     review.comment ?? '',
      reviewId:       review._id,
      userId:         reply.userId,
      corpusTexts,
      hourlyCount,
      dailyCount,
      oldestDailyAt,
      lastPublishedAt,
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

export const rescheduleReply = internalMutation({
  args: { replyId: v.id('replies'), scheduledAt: v.number() },
  handler: async (ctx, { replyId, scheduledAt }) => {
    await ctx.db.patch(replyId, { scheduledAt })
  },
})

export const markNeedsReview = internalMutation({
  args: {
    replyId:  v.id('replies'),
    userId:   v.id('users'),
    score:    v.number(),
    attempts: v.number(),
    reason:   v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.patch(args.replyId, {
      status:            'needs_review',
      needsReviewReason: args.reason,
    })
    await ctx.db.insert('similarityChecks', {
      replyId:   args.replyId,
      userId:    args.userId,
      attempts:  args.attempts,
      maxScore:  args.score,
      outcome:   'needs_review',
      reason:    args.reason,
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
      replyText:       string
      reviewText:      string
      reviewId:        Id<'reviews'>
      userId:          Id<'users'>
      corpusTexts:     string[]
      hourlyCount:     number
      dailyCount:      number
      oldestDailyAt:   number | undefined
      lastPublishedAt: number | undefined
      aiSettings:      AISettings
    } | null = await ctx.runQuery(internal.publish.getCheckData, { replyId })

    if (!data) return

    const now     = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000
    const MIN_GAP = 20 * 60 * 1000

    // ── Rate limits ─────────────────────────────────────────────────────────
    if (data.dailyCount >= 5) {
      const rescheduleAt = data.oldestDailyAt !== undefined
        ? data.oldestDailyAt + ONE_DAY
        : now + ONE_DAY
      await ctx.runMutation(internal.publish.rescheduleReply, { replyId, scheduledAt: rescheduleAt })
      return
    }

    if (data.hourlyCount >= 2) {
      await ctx.runMutation(internal.publish.rescheduleReply, { replyId, scheduledAt: now + randomMs(30, 90) })
      return
    }

    if (data.lastPublishedAt !== undefined && now - data.lastPublishedAt < MIN_GAP) {
      await ctx.runMutation(internal.publish.rescheduleReply, {
        replyId,
        scheduledAt: data.lastPublishedAt + randomMs(20, 180),
      })
      return
    }

    // ── Similarity check with preprocessing ─────────────────────────────────
    const { reviewText, reviewId, userId, corpusTexts, aiSettings } = data
    const stopTokens = buildStopTokens(aiSettings)
    const corpusSets = corpusTexts.map(t => buildTokenSet(t, stopTokens))

    let currentText = data.replyText
    let candidateSet = buildTokenSet(currentText, stopTokens)
    let threshold    = adaptiveThreshold(candidateSet.size)
    let score        = maxSimilarity(candidateSet, corpusSets)
    let attempts     = 0

    while (score > threshold && attempts < MAX_ATTEMPTS) {
      attempts++
      const newText = await generateVariedReply(reviewText, aiSettings, attempts)
      if (newText) {
        await ctx.runMutation(internal.publish.updateReplyText, { replyId, text: newText })
        currentText  = newText
        candidateSet = buildTokenSet(currentText, stopTokens)
        threshold    = adaptiveThreshold(candidateSet.size)
      }
      score = maxSimilarity(candidateSet, corpusSets)
    }

    if (score > threshold) {
      const reason = `Reply too similar to recent responses — similarity score ${(score * 100).toFixed(0)}% after ${attempts} regeneration attempt${attempts !== 1 ? 's' : ''}`
      await ctx.runMutation(internal.publish.markNeedsReview, {
        replyId, userId, score, attempts, reason,
      })
    } else {
      await ctx.runMutation(internal.publish.publishReply, {
        replyId, reviewId, userId, score, attempts,
      })
    }
  },
})
