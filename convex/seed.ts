import { internalMutation } from './_generated/server'

const REVIEWS = [
  {
    googleReviewId: 'seed-review-001',
    reviewerName: 'Luca Bianchi',
    starRating: 'FIVE' as const,
    comment: 'Servizio eccellente, staff molto professionale e disponibile. Tornerò sicuramente!',
    createTime: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    status: 'pending' as const,
  },
  {
    googleReviewId: 'seed-review-002',
    reviewerName: 'Sara Moretti',
    starRating: 'TWO' as const,
    comment: 'Esperienza deludente. Attesa molto lunga e il personale sembrava disinteressato. Mi aspettavo di meglio.',
    createTime: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    status: 'pending' as const,
  },
  {
    googleReviewId: 'seed-review-003',
    reviewerName: 'Marco Russo',
    starRating: 'FOUR' as const,
    comment: 'Ottima qualità, prezzi giusti. Solo un piccolo problema con la prenotazione online ma risolto rapidamente.',
    createTime: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    status: 'pending' as const,
    draft: 'Caro Marco, grazie mille per la tua recensione! Siamo felici che tu abbia apprezzato la qualità e i prezzi. Ci scusiamo per l\'inconveniente con la prenotazione online — abbiamo già segnalato il problema al team tecnico. Speriamo di rivederti presto!',
  },
  {
    googleReviewId: 'seed-review-004',
    reviewerName: 'Anna Conti',
    starRating: 'ONE' as const,
    comment: 'Pessimo servizio. Ho aspettato 40 minuti senza che nessuno si occupasse di me. Non tornerò.',
    createTime: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    status: 'pending' as const,
    draft: 'Gentile Anna, siamo molto dispiaciuti per la tua esperienza. Un\'attesa di 40 minuti è inaccettabile e non rispecchia i nostri standard. Ti chiediamo scusa e ti invitiamo a contattarci direttamente per trovare un modo di rimediare.',
  },
  {
    googleReviewId: 'seed-review-005',
    reviewerName: 'Giovanni Ferrari',
    starRating: 'FIVE' as const,
    comment: 'Perfetto in ogni dettaglio. Consiglio a tutti!',
    createTime: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    status: 'replied' as const,
    replyComment: 'Grazie Giovanni per le parole gentili! È un piacere sapere che hai vissuto un\'esperienza perfetta. Ti aspettiamo di nuovo!',
    replyUpdateTime: new Date(Date.now() - 19 * 86_400_000).toISOString(),
  },
  {
    googleReviewId: 'seed-review-006',
    reviewerName: 'Chiara Lombardi',
    starRating: 'THREE' as const,
    comment: 'Nella media. Niente di speciale ma nemmeno male. Il prodotto era ok ma il servizio potrebbe migliorare.',
    createTime: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    status: 'replied' as const,
    replyComment: 'Ciao Chiara, grazie per il feedback onesto. Prendiamo nota del tuo commento sul servizio e lavoreremo per migliorare. Speriamo di sorprenderti positivamente alla prossima visita!',
    replyUpdateTime: new Date(Date.now() - 28 * 86_400_000).toISOString(),
  },
]

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').first()
    if (!user) throw new Error('No users found — sign in first, then run the seed.')

    // Upsert a fake location
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

    // Insert reviews (skip if already seeded)
    for (const r of REVIEWS) {
      const existing = await ctx.db
        .query('reviews')
        .withIndex('by_user_and_google_id', q =>
          q.eq('userId', user._id).eq('googleReviewId', r.googleReviewId),
        )
        .unique()
      if (existing) continue

      const reviewId = await ctx.db.insert('reviews', {
        userId:          user._id,
        locationId,
        googleReviewId:  r.googleReviewId,
        reviewerName:    r.reviewerName,
        starRating:      r.starRating,
        comment:         r.comment,
        createTime:      r.createTime,
        updateTime:      r.createTime,
        replyComment:    r.replyComment,
        replyUpdateTime: r.replyUpdateTime,
        status:          r.status,
      })

      if (r.draft) {
        await ctx.db.insert('replies', {
          userId:      user._id,
          reviewId,
          draft:       r.draft,
          status:      'draft',
          generatedAt: Date.now(),
        })
      }
    }

    return `Seeded ${REVIEWS.length} reviews for ${user.email ?? user.tokenIdentifier}`
  },
})
