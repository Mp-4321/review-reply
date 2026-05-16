import { internalMutation } from './_generated/server'

type ReplyStatus = 'draft' | 'queued' | 'needs_review'

type SeedReview = {
  googleReviewId:    string
  reviewerName:      string
  starRating:        'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment:           string
  daysAgo:           number
  status:            'pending' | 'replied'
  replyStatus?:      ReplyStatus
  draft?:            string
  needsReviewReason?: string
  replyComment?:     string
  replyDaysAgo?:     number
}

const REVIEWS: SeedReview[] = [
  // ── pending — no draft yet ────────────────────────────────────────────────
  {
    googleReviewId: 'seed-r-001',
    reviewerName:   'Sofia Caruso',
    starRating:     'FOUR',
    comment:        'Cena piacevole in un ambiente accogliente. La pasta fatta in casa era davvero ottima e il personale gentile. Unico neo: tempi un po\' lunghi tra una portata e l\'altra, ma niente che abbia rovinato la serata.',
    daysAgo:        2,
    status:         'pending',
  },
  // ── draft — bozza generata, in attesa di approvazione ────────────────────
  {
    googleReviewId: 'seed-r-002',
    reviewerName:   'Marco Pellegrini',
    starRating:     'TWO',
    comment:        'Mi aspettavo di più. Il locale è carino ma il servizio era disattento e il conto aveva un errore che ho dovuto far correggere. La cucina nella media, niente che giustifichi i prezzi. Difficilmente tornerò.',
    daysAgo:        5,
    status:         'pending',
    replyStatus:    'draft',
    draft:          'Gentile Marco, la ringraziamo per il feedback. Siamo dispiaciuti per i disagi riscontrati — ci impegniamo a migliorare il servizio e l\'attenzione ai dettagli. Ci auguriamo di poterla accogliere nuovamente per dimostrarle la qualità che meritiamo di offrire.',
  },
  // ── queued — in coda per la pubblicazione ─────────────────────────────────
  {
    googleReviewId: 'seed-r-003',
    reviewerName:   'Giulia Ferretti',
    starRating:     'FIVE',
    comment:        'Pranzo di lavoro perfetto. Ambiente elegante ma non formale, menu variegato, servizio puntuale. Il risotto al tartufo era eccezionale. Il team ha apprezzato molto. Torneremo sicuramente.',
    daysAgo:        3,
    status:         'pending',
    replyStatus:    'queued',
    draft:          'Cara Giulia, siamo lieti che il pranzo di lavoro sia stato all\'altezza delle aspettative. Il risotto al tartufo è uno dei nostri piatti del cuore — felici che abbia conquistato tutto il team. Vi aspettiamo presto!',
  },
  // ── needs_review — similarity check fallito ───────────────────────────────
  {
    googleReviewId:    'seed-r-004',
    reviewerName:      'Luca Bernardi',
    starRating:        'THREE',
    comment:           'Posto nella media. Cibo discreto, niente di straordinario. Prezzi un po\' alti per quello che offrono. Servizio nella norma. Potrebbe migliorare.',
    daysAgo:           7,
    status:            'pending',
    replyStatus:       'needs_review',
    draft:             'Gentile Luca, grazie per il suo riscontro. Prendiamo nota delle sue osservazioni su prezzo e qualità e lavoreremo per migliorare la sua esperienza in futuro.',
    needsReviewReason: 'Reply too similar to recent responses — similarity score 74% after 3 regeneration attempts',
  },
  // ── replied — già pubblicata ──────────────────────────────────────────────
  {
    googleReviewId: 'seed-r-005',
    reviewerName:   'Irene Montanari',
    starRating:     'FIVE',
    comment:        'Serata perfetta per il nostro anniversario. Tavolo riservato con piccola sorpresa floreale, menù degustazione eccezionale e sommelier preparatissimo. Un\'esperienza che ricorderemo a lungo. Grazie di cuore a tutto lo staff.',
    daysAgo:        10,
    status:         'replied',
    replyComment:   'Cara Irene, siamo davvero felici di aver reso speciale il vostro anniversario! La cura per i momenti importanti è al centro di tutto quello che facciamo. Speriamo di rivedervi presto per un\'altra serata indimenticabile.',
    replyDaysAgo:   9,
  },
]

const OLD_SEED_IDS = [
  'seed-review-001', 'seed-review-002', 'seed-review-003',
  'seed-review-004', 'seed-review-005', 'seed-review-006',
  'seed-r-001', 'seed-r-002', 'seed-r-003', 'seed-r-004',
  'seed-r-005', 'seed-r-006', 'seed-r-007', 'seed-r-008',
  'seed-r-009', 'seed-r-010',
]

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').first()
    if (!user) throw new Error('No users found — sign in first, then run the seed.')

    // Reset: delete all existing seed reviews and their replies
    for (const googleReviewId of OLD_SEED_IDS) {
      const existing = await ctx.db
        .query('reviews')
        .withIndex('by_user_and_google_id', q =>
          q.eq('userId', user._id).eq('googleReviewId', googleReviewId),
        )
        .unique()
      if (!existing) continue

      const replies = await ctx.db
        .query('replies')
        .withIndex('by_review', q => q.eq('reviewId', existing._id))
        .collect()
      for (const reply of replies) await ctx.db.delete(reply._id)
      await ctx.db.delete(existing._id)
    }

    // Upsert location
    const existingLoc = await ctx.db
      .query('locations')
      .withIndex('by_user_and_google_id', q =>
        q.eq('userId', user._id).eq('googleLocationId', 'seed-location-001'),
      )
      .unique()

    const locationId = existingLoc
      ? existingLoc._id
      : await ctx.db.insert('locations', {
          userId:           user._id,
          googleLocationId: 'seed-location-001',
          accountId:        'seed-account-001',
          displayName:      'The Style Co.',
          address:          'Main Street, Boston',
          syncedAt:         Date.now(),
        })

    // Insert fresh reviews
    for (const r of REVIEWS) {
      const createTime = new Date(Date.now() - r.daysAgo * 86_400_000).toISOString()

      const reviewId = await ctx.db.insert('reviews', {
        userId:          user._id,
        locationId,
        googleReviewId:  r.googleReviewId,
        reviewerName:    r.reviewerName,
        starRating:      r.starRating,
        comment:         r.comment,
        createTime,
        updateTime:      createTime,
        replyComment:    r.replyComment,
        replyUpdateTime: r.replyDaysAgo
          ? new Date(Date.now() - r.replyDaysAgo * 86_400_000).toISOString()
          : undefined,
        status: r.status,
      })

      if (r.draft && r.replyStatus) {
        await ctx.db.insert('replies', {
          userId:            user._id,
          reviewId,
          draft:             r.draft,
          status:            r.replyStatus,
          generatedAt:       Date.now(),
          ...(r.replyStatus === 'queued'       ? { scheduledAt: Date.now() + 35 * 60 * 1000 } : {}),
          ...(r.replyStatus === 'needs_review' ? { needsReviewReason: r.needsReviewReason }   : {}),
        })
      }
    }

    return `Seeded ${REVIEWS.length} reviews for ${user.email ?? user.tokenIdentifier}`
  },
})
