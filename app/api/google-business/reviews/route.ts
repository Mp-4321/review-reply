import { NextRequest } from 'next/server'
import { GoogleBusinessError, listGoogleBusinessReviews, requireClerkUserId } from '@/app/lib/google-business'
import { checkRateLimit, getCached, setCache, CACHE_TTL, withRetry } from '@/app/lib/google-business-controls'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const userId = await requireClerkUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed, retryAfter } = checkRateLimit(userId)
  if (!allowed) {
    return Response.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const locationId   = searchParams.get('locationId')

  const cacheKey = `reviews:${userId}:${locationId ?? 'all'}`
  const cached   = getCached<unknown>(cacheKey)
  if (cached) {
    return Response.json(cached)
  }

  try {
    const data = await withRetry(() => listGoogleBusinessReviews(userId, {
      parent:     searchParams.get('parent'),
      accountId:  searchParams.get('accountId'),
      locationId,
      pageSize:   searchParams.get('pageSize'),
      pageToken:  searchParams.get('pageToken'),
      orderBy:    searchParams.get('orderBy'),
    }))

    setCache(cacheKey, data, CACHE_TTL.REVIEWS)
    return Response.json(data)
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business reviews error: fetch failed')
    return Response.json({ error: 'Failed to fetch Google Business reviews' }, { status: 500 })
  }
}
