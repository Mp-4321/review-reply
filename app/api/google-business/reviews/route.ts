import { NextRequest } from 'next/server'
import { GoogleBusinessError, listGoogleBusinessReviews, requireClerkUserId } from '@/app/lib/google-business'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const userId = await requireClerkUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams

  try {
    const data = await listGoogleBusinessReviews(userId, {
      parent: searchParams.get('parent'),
      accountId: searchParams.get('accountId'),
      locationId: searchParams.get('locationId'),
      pageSize: searchParams.get('pageSize'),
      pageToken: searchParams.get('pageToken'),
      orderBy: searchParams.get('orderBy'),
    })

    return Response.json(data)
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business reviews error:', error)
    return Response.json({ error: 'Failed to fetch Google Business reviews' }, { status: 500 })
  }
}
