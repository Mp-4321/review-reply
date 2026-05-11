'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export function DashboardStats() {
  const s = useQuery(api.reviews.stats)

  const pending  = s?.pending   ?? '—'
  const total    = s?.total     ?? '—'
  const avg      = s?.avgRating ?? '—'
  const replied  = s?.replied   ?? '—'

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Replies generated</p>
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{replied}</p>
        <p className="mt-1 text-xs text-slate-400">All time</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Reviews pending</p>
          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{pending}</p>
        <p className="mt-1 text-xs text-slate-400">Awaiting your reply</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Current rating</p>
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{avg}</p>
        <p className="mt-1 text-xs text-slate-400">Google Business</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Total reviews</p>
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{total}</p>
        <p className="mt-1 text-xs text-slate-400">All time</p>
      </div>
    </div>
  )
}
