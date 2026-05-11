import { GoogleBusinessError, disconnectGoogleBusiness, requireClerkUserId } from '@/app/lib/google-business'

export const runtime = 'nodejs'

export async function POST() {
  const userId = await requireClerkUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await disconnectGoogleBusiness(userId)
    return Response.json({ disconnected: true })
  } catch (error) {
    if (error instanceof GoogleBusinessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Google Business disconnect error:', error)
    return Response.json({ error: 'Failed to disconnect Google Business Profile' }, { status: 500 })
  }
}

export async function DELETE() {
  return POST()
}
