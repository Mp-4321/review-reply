import { internalMutation } from './_generated/server'

const REVIEWS = [
  // ── 6 pending, no draft → Awaiting Reply ──────────────────────────────────
  {
    googleReviewId: 'seed-r-001',
    reviewerName:   'Giulia Ferrero',
    starRating:     'FIVE' as const,
    comment:        'Serata indimenticabile per il nostro anniversario! Il personale ha preparato una piccola sorpresa a tavola senza che lo chiedessimo. Cucina raffinata, vini selezionati e servizio impeccabile. Raramente si trova un posto con questa cura per i dettagli.',
    daysAgo:        1,
    status:         'pending' as const,
  },
  {
    googleReviewId: 'seed-r-002',
    reviewerName:   'Alessandro Ricci',
    starRating:     'FOUR' as const,
    comment:        'Ottima cucina, porzioni generose e prezzi onesti. L\'unica pecca è stata l\'attesa per il tavolo — quasi 20 minuti nonostante la prenotazione confermata. Il personale si è scusato e ha offerto un aperitivo in omaggio, quindi apprezzo il gesto.',
    daysAgo:        3,
    status:         'pending' as const,
  },
  {
    googleReviewId: 'seed-r-003',
    reviewerName:   'Federica Gallo',
    starRating:     'ONE' as const,
    comment:        'Ho prenotato con una settimana di anticipo e al mio arrivo non trovavano la prenotazione. Siamo rimasti in piedi per trenta minuti senza che nessuno si facesse carico della situazione. Alla fine abbiamo rinunciato e siamo andati altrove. Servizio caotico e poco professionale.',
    daysAgo:        4,
    status:         'pending' as const,
  },
  {
    googleReviewId: 'seed-r-004',
    reviewerName:   'Davide Marino',
    starRating:     'TWO' as const,
    comment:        'Il cibo era nella norma ma il servizio è stato deludente. Ho dovuto chiedere due volte l\'acqua e aspettare quasi 15 minuti per il conto. Il tavolo accanto al nostro sembrava ricevere attenzione decisamente maggiore. Per i prezzi praticati mi aspettavo di più.',
    daysAgo:        6,
    status:         'pending' as const,
  },
  {
    googleReviewId: 'seed-r-005',
    reviewerName:   'Valentina Bruno',
    starRating:     'FIVE' as const,
    comment:        'Ho provato il menù degustazione sabato scorso: ogni piatto era una sorpresa autentica. Lo chef è uscito a salutare i tavoli a fine serata — un gesto raro che fa sentire davvero ospiti speciali. Tornerò con certezza.',
    daysAgo:        8,
    status:         'pending' as const,
  },
  {
    googleReviewId: 'seed-r-006',
    reviewerName:   'Matteo Esposito',
    starRating:     'THREE' as const,
    comment:        'Ambiente curato e personale cordiale. La cucina è però altalenante: il risotto era eccellente, il secondo piatto decisamente anonimo. Per il prezzo che si paga ci si aspetta una maggiore consistenza. Forse ci riprovo tra qualche mese.',
    daysAgo:        10,
    status:         'pending' as const,
  },
  // ── 1 pending with draft → Draft Replies ──────────────────────────────────
  {
    googleReviewId: 'seed-r-007',
    reviewerName:   'Elisa Rossini',
    starRating:     'FOUR' as const,
    comment:        'Locale molto piacevole e cucina di qualità. Noto però che il menù potrebbe essere aggiornato con più opzioni vegetariane — come cliente abituale è qualcosa che sento ogni volta. Il personale è sempre gentile e disponibile.',
    daysAgo:        13,
    status:         'pending' as const,
    draft:          'Cara Elisa, grazie mille per la tua fedeltà e per il feedback prezioso! Hai ragione: stiamo lavorando a un aggiornamento del menù che includerà nuove proposte vegetariane. Siamo felici di averti come cliente abituale e non vediamo l\'ora di sorprenderti!',
  },
  // ── 1 pending with queued reply ────────────────────────────────────────────
  {
    googleReviewId: 'seed-r-008',
    reviewerName:   'Riccardo Conti',
    starRating:     'FIVE' as const,
    comment:        'Pranzo di lavoro perfetto. Velocità, riservatezza e qualità: tutto quello che serve per un incontro professionale importante. Il tavolo riservato era pronto in anticipo e il personale ha capito subito le nostre esigenze senza bisogno di spiegazioni.',
    daysAgo:        15,
    status:         'pending' as const,
    queued:         'Caro Riccardo, siamo molto lieti che il tuo pranzo di lavoro sia andato nel migliore dei modi! Riservatezza e puntualità sono valori in cui crediamo profondamente. Saremo felici di accoglierti nuovamente per i tuoi prossimi impegni professionali.',
  },
  // ── 2 replied ──────────────────────────────────────────────────────────────
  {
    googleReviewId:  'seed-r-009',
    reviewerName:    'Camilla Ferretti',
    starRating:      'FIVE' as const,
    comment:         'Festeggiato qui il compleanno di mia sorella con tutto il gruppo. Eravamo in dodici e il personale ha gestito tutto alla perfezione. Nessun ritardo, nessun errore sugli ordini e una torta di compleanno a sorpresa preparata dalla cucina. Consiglio vivamente per le occasioni speciali.',
    daysAgo:         22,
    status:          'replied' as const,
    replyComment:    'Cara Camilla, che bello sapere che la serata per il compleanno di tua sorella è riuscita così bene! Gestire un gruppo numeroso con cura è sempre una sfida che affrontiamo con entusiasmo. Speriamo di festeggiare con voi ancora tante occasioni speciali!',
    replyDaysAgo:    21,
  },
  {
    googleReviewId:  'seed-r-010',
    reviewerName:    'Lorenzo Vitale',
    starRating:      'TWO' as const,
    comment:         'Deluso dall\'ultima visita. Ero già venuto mesi fa con una buona impressione, ma questa volta il servizio era disorganizzato e il piatto che avevo scelto non era disponibile — nessuno ce lo aveva comunicato prima di ordinare. Spero fosse solo una serata storta.',
    daysAgo:         28,
    status:          'replied' as const,
    replyComment:    'Gentile Lorenzo, ci dispiace molto per la tua esperienza. Comunicare tempestivamente la disponibilità dei piatti è qualcosa su cui dobbiamo assolutamente migliorare. Ti chiediamo scusa e ti invitiamo a darci una nuova possibilità — faremo il possibile per renderti la visita memorabile.',
    replyDaysAgo:    26,
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

      if (r.draft) {
        await ctx.db.insert('replies', {
          userId:      user._id,
          reviewId,
          draft:       r.draft,
          status:      'draft',
          generatedAt: Date.now(),
        })
      }

      if (r.queued) {
        await ctx.db.insert('replies', {
          userId:      user._id,
          reviewId,
          draft:       r.queued,
          status:      'queued',
          generatedAt: Date.now(),
          scheduledAt: Date.now() + 25 * 60 * 1000,
        })
      }
    }

    return `Seeded ${REVIEWS.length} reviews for ${user.email ?? user.tokenIdentifier}`
  },
})
