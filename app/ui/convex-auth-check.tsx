'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export function ConvexAuthCheck() {
  const me = useQuery(api.users.me)

  if (me === undefined) return (
    <p className="text-xs text-slate-400">Checking Convex auth…</p>
  )

  if (me === null) return (
    <p className="text-xs text-red-500">Convex: not authenticated</p>
  )

  return (
    <p className="text-xs text-green-600">
      Convex auth OK — {me.email ?? me.clerkId}
    </p>
  )
}
