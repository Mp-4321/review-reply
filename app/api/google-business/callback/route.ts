import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleBusinessError,
  exchangeCodeForGoogleConnection,
  requireClerkUserId,
} from '@/app/lib/google-business'

export const runtime = 'nodejs'

const GOOGLE_OAUTH_STATE_COOKIE = 'google_business_oauth_state'

export async function GET(request: NextRequest) {
  const userId = await requireClerkUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const error = searchParams.get('error')
  if (error) {
    return Response.json({ error }, { status: 400 })
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value
  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE)

  if (!code || !state || !expectedState || state !== expectedState) {
    return Response.json({ error: 'Invalid OAuth callback state' }, { status: 400 })
  }

  try {
    await exchangeCodeForGoogleConnection(userId, code)
    return NextResponse.redirect(new URL('/?google_business=connected', request.url))
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business OAuth callback error:', error)
    return Response.json({ error: 'Failed to connect Google Business Profile' }, { status: 500 })
  }
}
