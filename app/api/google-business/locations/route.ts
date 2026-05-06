import { GoogleBusinessError, listGoogleBusinessLocations, requireClerkUserId } from '@/app/lib/google-business'

export const runtime = 'nodejs'

export async function GET() {
  const userId = await requireClerkUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await listGoogleBusinessLocations(userId)
    return Response.json(data)
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business locations error:', error)
    return Response.json({ error: 'Failed to fetch Google Business locations' }, { status: 500 })
  }
}
