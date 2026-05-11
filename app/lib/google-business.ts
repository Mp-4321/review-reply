import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { auth, clerkClient } from '@clerk/nextjs/server'

const GOOGLE_BUSINESS_SCOPE = 'https://www.googleapis.com/auth/business.manage'
const GOOGLE_PROFILE_SCOPES = ['openid', 'email', 'profile']
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'
const GOOGLE_ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
const GOOGLE_BUSINESS_INFO_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GOOGLE_REVIEWS_URL = 'https://mybusiness.googleapis.com/v4'

const TOKEN_REFRESH_MARGIN_MS = 60_000
const ENCRYPTION_VERSION = 1

type EncryptedToken = {
  v: number
  iv: string
  tag: string
  value: string
}

export type GoogleBusinessConnection = {
  accessToken: EncryptedToken
  refreshToken: EncryptedToken
  expiryDate: number
  scopes: string[]
  accountEmail?: string | null
  connectedAt: string
  updatedAt: string
}

type GoogleBusinessPrivateMetadata = {
  googleBusiness?: GoogleBusinessConnection
}

type GoogleTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
}

type GoogleUserInfoResponse = {
  email?: string
}

type GoogleApiErrorResponse = {
  error?: {
    code?: number
    message?: string
    status?: string
    details?: Array<{
      reason?: string
    }>
  }
}

export class GoogleBusinessError extends Error {
  constructor(
    message: string,
    public status = 500
  ) {
    super(message)
  }
}

export function getGoogleOAuthScopes() {
  return [...GOOGLE_PROFILE_SCOPES, GOOGLE_BUSINESS_SCOPE]
}

export async function requireClerkUserId() {
  const { userId } = await auth()
  return userId
}

export function buildGoogleOAuthUrl(state: string) {
  const clientId = requireGoogleClientId()
  const redirectUri = requireGoogleRedirectUri()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: getGoogleOAuthScopes().join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForGoogleConnection(
  userId: string,
  code: string
) {
  const existingConnection = await getGoogleBusinessConnection(userId)
  const tokenResponse = await exchangeCodeForTokens(code)

  if (!tokenResponse.access_token) {
    throw new GoogleBusinessError('Google did not return an access token', 502)
  }

  const previousRefreshToken = existingConnection
    ? decryptToken(existingConnection.refreshToken)
    : null
  const refreshToken = tokenResponse.refresh_token ?? previousRefreshToken

  if (!refreshToken) {
    throw new GoogleBusinessError(
      'Google did not return a refresh token. Try reconnecting and approving offline access.',
      502
    )
  }

  const now = Date.now()
  const accountEmail = await fetchGoogleAccountEmail(tokenResponse.access_token)
  const connection: GoogleBusinessConnection = {
    accessToken: encryptToken(tokenResponse.access_token),
    refreshToken: encryptToken(refreshToken),
    expiryDate: now + (tokenResponse.expires_in ?? 3600) * 1000,
    scopes: parseScopes(tokenResponse.scope),
    accountEmail,
    connectedAt: existingConnection?.connectedAt ?? new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  }

  await saveGoogleBusinessConnection(userId, connection)
  return connection
}

export async function listGoogleBusinessLocations(userId: string) {
  const accountsResponse = await googleApiFetch(userId, GOOGLE_ACCOUNTS_URL)
  const accountsJson = await parseGoogleJson<{
    accounts?: Array<Record<string, unknown>>
  }>(accountsResponse)
  const accounts = accountsJson.accounts ?? []

  const accountsWithLocations = await Promise.all(
    accounts.map(async (account) => {
      const accountName = typeof account.name === 'string' ? account.name : null
      if (!accountName) {
        return { account, locations: [] }
      }

      const params = new URLSearchParams({
        pageSize: '100',
        readMask: 'name,title,storefrontAddress,metadata,storeCode,phoneNumbers,websiteUri',
      })
      const locationsResponse = await googleApiFetch(
        userId,
        `${GOOGLE_BUSINESS_INFO_URL}/${accountName}/locations?${params.toString()}`
      )
      const locationsJson = await parseGoogleJson<{
        locations?: Array<Record<string, unknown>>
        nextPageToken?: string
      }>(locationsResponse)

      return {
        account,
        locations: (locationsJson.locations ?? []).map((location) =>
          normalizeLocation(accountName, location)
        ),
        nextPageToken: locationsJson.nextPageToken ?? null,
      }
    })
  )

  return { accounts: accountsWithLocations }
}

export async function listGoogleBusinessReviews(
  userId: string,
  params: {
    parent?: string | null
    accountId?: string | null
    locationId?: string | null
    pageSize?: string | null
    pageToken?: string | null
    orderBy?: string | null
  }
) {
  const parent = normalizeReviewParent(params)
  const pageSize = clampPageSize(params.pageSize, 50)
  const orderBy = normalizeReviewOrder(params.orderBy)
  const query = new URLSearchParams({
    pageSize: String(pageSize),
    orderBy,
  })

  if (params.pageToken) {
    query.set('pageToken', params.pageToken)
  }

  const response = await googleApiFetch(
    userId,
    `${GOOGLE_REVIEWS_URL}/${parent}/reviews?${query.toString()}`
  )

  return parseGoogleJson<{
    reviews?: Array<Record<string, unknown>>
    averageRating?: number
    totalReviewCount?: number
    nextPageToken?: string
  }>(response)
}

export async function disconnectGoogleBusiness(userId: string) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const privateMetadata = { ...user.privateMetadata }
  delete privateMetadata.googleBusiness

  await client.users.updateUserMetadata(userId, {
    privateMetadata,
  })
}

async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: requireGoogleClientId(),
    client_secret: requireGoogleClientSecret(),
    redirect_uri: requireGoogleRedirectUri(),
    grant_type: 'authorization_code',
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  return parseGoogleTokenResponse(response)
}

async function refreshAccessToken(userId: string, connection: GoogleBusinessConnection) {
  const refreshToken = decryptToken(connection.refreshToken)
  const body = new URLSearchParams({
    client_id: requireGoogleClientId(),
    client_secret: requireGoogleClientSecret(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const tokenResponse = await parseGoogleTokenResponse(response)

  if (!tokenResponse.access_token) {
    throw new GoogleBusinessError('Google did not return a refreshed access token', 502)
  }

  const now = Date.now()
  const nextConnection: GoogleBusinessConnection = {
    ...connection,
    accessToken: encryptToken(tokenResponse.access_token),
    expiryDate: now + (tokenResponse.expires_in ?? 3600) * 1000,
    scopes: parseScopes(tokenResponse.scope, connection.scopes),
    updatedAt: new Date(now).toISOString(),
  }

  await saveGoogleBusinessConnection(userId, nextConnection)
  return tokenResponse.access_token
}

async function googleApiFetch(userId: string, url: string) {
  const accessToken = await getValidAccessToken(userId)
  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 401) {
    const connection = await requireGoogleBusinessConnection(userId)
    const refreshedAccessToken = await refreshAccessToken(userId, connection)
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${refreshedAccessToken}` },
    })
  }

  if (!response.ok) {
    throw await createGoogleApiError(response)
  }

  return response
}

async function getValidAccessToken(userId: string) {
  const connection = await requireGoogleBusinessConnection(userId)
  if (connection.expiryDate > Date.now() + TOKEN_REFRESH_MARGIN_MS) {
    return decryptToken(connection.accessToken)
  }

  return refreshAccessToken(userId, connection)
}

async function requireGoogleBusinessConnection(userId: string) {
  const connection = await getGoogleBusinessConnection(userId)
  if (!connection) {
    throw new GoogleBusinessError('Google Business Profile is not connected', 409)
  }

  return connection
}

async function getGoogleBusinessConnection(userId: string) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const metadata = user.privateMetadata as GoogleBusinessPrivateMetadata

  return metadata.googleBusiness ?? null
}

async function saveGoogleBusinessConnection(
  userId: string,
  connection: GoogleBusinessConnection
) {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      googleBusiness: connection,
    },
  })
}

async function fetchGoogleAccountEmail(accessToken: string) {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return null
    const json = (await response.json()) as GoogleUserInfoResponse
    return json.email ?? null
  } catch {
    return null
  }
}

async function parseGoogleTokenResponse(response: Response) {
  const json = (await response.json()) as GoogleTokenResponse
  if (!response.ok) {
    throw new GoogleBusinessError(
      json.error_description ?? json.error ?? 'Google OAuth token request failed',
      response.status
    )
  }

  return json
}

async function parseGoogleJson<T>(response: Response) {
  return (await response.json()) as T
}

function normalizeLocation(accountName: string, location: Record<string, unknown>) {
  const locationName = typeof location.name === 'string' ? location.name : ''
  const locationId = locationName.split('/').pop() ?? locationName

  return {
    ...location,
    accountName,
    locationId,
    reviewParent: `${accountName}/locations/${locationId}`,
  }
}

function normalizeReviewParent(params: {
  parent?: string | null
  accountId?: string | null
  locationId?: string | null
}) {
  if (params.parent && /^accounts\/[^/]+\/locations\/[^/]+$/.test(params.parent)) {
    return params.parent
  }

  if (params.accountId && params.locationId) {
    return `accounts/${params.accountId}/locations/${params.locationId}`
  }

  throw new GoogleBusinessError(
    'Missing review location. Provide parent or accountId and locationId.',
    400
  )
}

function normalizeReviewOrder(orderBy?: string | null) {
  const allowed = new Set(['rating', 'rating desc', 'updateTime desc'])
  if (orderBy && allowed.has(orderBy)) {
    return orderBy
  }

  return 'updateTime desc'
}

function clampPageSize(value: string | null | undefined, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return max
  return Math.min(Math.max(Math.floor(parsed), 1), max)
}

function parseScopes(scope?: string, fallback: string[] = getGoogleOAuthScopes()) {
  if (!scope) return fallback
  return scope.split(' ').filter(Boolean)
}

function encryptToken(value: string): EncryptedToken {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

  return {
    v: ENCRYPTION_VERSION,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    value: encrypted.toString('base64'),
  }
}

function decryptToken(token: EncryptedToken) {
  if (token.v !== ENCRYPTION_VERSION) {
    throw new GoogleBusinessError('Unsupported encrypted token version', 500)
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(token.iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(token.tag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(token.value, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

function getEncryptionKey() {
  const secret = requireEnv('GOOGLE_TOKEN_ENCRYPTION_KEY')
  const hex = /^[a-f0-9]{64}$/i.test(secret) ? Buffer.from(secret, 'hex') : null
  if (hex?.length === 32) return hex

  const base64 = Buffer.from(secret, 'base64')
  if (base64.length === 32) return base64

  const utf8 = Buffer.from(secret, 'utf8')
  if (utf8.length === 32) return utf8

  return createHash('sha256').update(secret).digest()
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new GoogleBusinessError(`Missing required environment variable: ${name}`, 500)
  }

  return value
}

function requireGoogleClientId() {
  const value = requireEnv('GOOGLE_CLIENT_ID')
  if (!value.endsWith('.apps.googleusercontent.com')) {
    throw new GoogleBusinessError(
      'Invalid environment variable: GOOGLE_CLIENT_ID. Expected OAuth client ID ending in .apps.googleusercontent.com',
      500
    )
  }

  return value
}

function requireGoogleClientSecret() {
  const value = requireEnv('GOOGLE_CLIENT_SECRET')
  if (value === '...') {
    throw new GoogleBusinessError(
      'Invalid environment variable: GOOGLE_CLIENT_SECRET. Expected non-empty OAuth client secret.',
      500
    )
  }

  return value
}

function requireGoogleRedirectUri() {
  const value = requireEnv('GOOGLE_REDIRECT_URI')
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw new GoogleBusinessError(
      'Invalid environment variable: GOOGLE_REDIRECT_URI. Expected absolute URL, for local testing use http://localhost:3000/api/google-business/callback',
      500
    )
  }

  return value
}

async function createGoogleApiError(response: Response) {
  const fallback = 'Google Business Profile API request failed'

  try {
    const json = (await response.json()) as GoogleApiErrorResponse
    const reason = json.error?.details?.find((detail) => detail.reason)?.reason
    const status = json.error?.status
    const message = json.error?.message ?? fallback

    if (response.status === 403 && reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT') {
      return new GoogleBusinessError(
        'Google Business Profile access token has insufficient scopes. Disconnect and reconnect Google Business Profile to grant business.manage.',
        403
      )
    }

    return new GoogleBusinessError(
      [status, reason, message].filter(Boolean).join(': '),
      response.status
    )
  } catch {
    return new GoogleBusinessError(fallback, response.status)
  }
}
