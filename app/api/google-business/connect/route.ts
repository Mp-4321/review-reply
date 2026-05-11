import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { GoogleBusinessError, buildGoogleOAuthUrl, requireClerkUserId } from '@/app/lib/google-business'

export const runtime = 'nodejs'

const GOOGLE_OAUTH_STATE_COOKIE = 'google_business_oauth_state'

export async function GET() {
  const userId = await requireClerkUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = randomBytes(32).toString('base64url')
  const cookieStore = await cookies()
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  })

  try {
    return NextResponse.redirect(buildGoogleOAuthUrl(state))
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business connect error:', error)
    return Response.json({ error: 'Failed to start Google Business OAuth flow' }, { status: 500 })
  }
}
