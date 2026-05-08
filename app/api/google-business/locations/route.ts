import { GoogleBusinessError, listGoogleBusinessLocations, requireClerkUserId } from '@/app/lib/google-business'
import { checkRateLimit, getCached, setCache, CACHE_TTL, withRetry } from '@/app/lib/google-business-controls'

export const runtime = 'nodejs'

export async function GET() {
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

  const cacheKey = `locations:${userId}`
  const cached = getCached<unknown>(cacheKey)
  if (cached) {
    return Response.json(cached)
  }

  try {
    const data = await withRetry(() => listGoogleBusinessLocations(userId))
    setCache(cacheKey, data, CACHE_TTL.LOCATIONS)
    return Response.json(data)
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business locations error: fetch failed')
    return Response.json({ error: 'Failed to fetch Google Business locations' }, { status: 500 })
  }
}
