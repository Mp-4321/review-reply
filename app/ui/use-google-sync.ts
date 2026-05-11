'use client'

import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

type StarRating = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
const VALID_RATINGS = new Set<StarRating>(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'])

function toStarRating(value: unknown): StarRating {
  if (typeof value === 'string' && VALID_RATINGS.has(value as StarRating)) {
    return value as StarRating
  }
  return 'FIVE'
}

function formatAddress(addr: unknown): string | undefined {
  if (!addr || typeof addr !== 'object') return undefined
  const a = addr as Record<string, unknown>
  const lines = Array.isArray(a.addressLines) ? (a.addressLines as string[]).join(', ') : ''
  const city  = typeof a.locality === 'string' ? a.locality : ''
  return [lines, city].filter(Boolean).join(' · ') || undefined
}

async function syncGoogleData(
  upsertLocation: (args: {
    googleLocationId: string
    accountId: string
    displayName: string
    address?: string
  }) => Promise<Id<'locations'>>,
  upsertReview: (args: {
    locationId: Id<'locations'>
    googleReviewId: string
    reviewerName: string
    starRating: StarRating
    comment?: string
    createTime: string
    updateTime: string
    replyComment?: string
    replyUpdateTime?: string
  }) => Promise<Id<'reviews'>>,
) {
  const locRes = await fetch('/api/google-business/locations')
  if (!locRes.ok) return

  const locData = (await locRes.json()) as {
    accounts?: Array<{
      account: Record<string, unknown>
      locations: Array<Record<string, unknown>>
    }>
  }

  for (const accountData of locData.accounts ?? []) {
    for (const location of accountData.locations) {
      const googleLocationId = typeof location.name === 'string' ? location.name : ''
      const accountName      = typeof location.accountName === 'string' ? location.accountName : ''
      const displayName      = typeof location.title === 'string' ? location.title : googleLocationId
      if (!googleLocationId || !accountName) continue

      const locationId = await upsertLocation({
        googleLocationId,
        accountId:   accountName,
        displayName,
        address:     formatAddress(location.storefrontAddress),
      })

      const reviewParent = typeof location.reviewParent === 'string' ? location.reviewParent : null
      if (!reviewParent) continue

      const revRes = await fetch(
        `/api/google-business/reviews?parent=${encodeURIComponent(reviewParent)}`
      )
      if (!revRes.ok) continue

      const revData = (await revRes.json()) as {
        reviews?: Array<Record<string, unknown>>
      }

      for (const review of revData.reviews ?? []) {
        const googleReviewId = typeof review.name === 'string' ? review.name : ''
        const createTime     = typeof review.createTime === 'string' ? review.createTime : new Date().toISOString()
        const updateTime     = typeof review.updateTime === 'string' ? review.updateTime : createTime
        if (!googleReviewId) continue

        const reviewer    = review.reviewer as Record<string, unknown> | undefined
        const reviewReply = review.reviewReply as Record<string, unknown> | undefined

        await upsertReview({
          locationId,
          googleReviewId,
          reviewerName:    typeof reviewer?.displayName === 'string' ? reviewer.displayName : 'Anonymous',
          starRating:      toStarRating(review.starRating),
          comment:         typeof review.comment === 'string' ? review.comment : undefined,
          createTime,
          updateTime,
          replyComment:    typeof reviewReply?.comment === 'string' ? reviewReply.comment : undefined,
          replyUpdateTime: typeof reviewReply?.updateTime === 'string' ? reviewReply.updateTime : undefined,
        })
      }
    }
  }
}

export function useGoogleSync() {
  const locations      = useQuery(api.locations.list)
  const upsertLocation = useMutation(api.locations.upsert)
  const upsertReview   = useMutation(api.reviews.upsert)
  const running        = useRef(false)

  useEffect(() => {
    if (locations === undefined) return
    if (running.current) return

    const stale = locations.length === 0 ||
      locations.some(l => Date.now() - l.syncedAt > SYNC_INTERVAL_MS)
    if (!stale) return

    running.current = true
    syncGoogleData(upsertLocation, upsertReview).finally(() => {
      running.current = false
    })
  }, [locations, upsertLocation, upsertReview])
}
