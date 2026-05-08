/**
 * Server-side usage controls for Google Business Profile API.
 * In-memory only — resets on server restart (acceptable for MVP).
 */

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_MAX    = 30
const RATE_LIMIT_WINDOW = 60_000 // ms

export function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now   = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry>()

export function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache(key: string, data: unknown, ttlMs: number): void {
  cacheStore.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export const CACHE_TTL = {
  LOCATIONS: 7 * 60_000,  // 7 min
  REVIEWS:   2 * 60_000,  // 2 min
} as const

// ---------------------------------------------------------------------------
// Retry with backoff — at most 1 retry, only for temporary errors
// ---------------------------------------------------------------------------

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message
    return (
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('quota')
    )
  }
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isRetryable(err)) {
      await sleep(1_200)
      return fn()
    }
    throw err
  }
}
