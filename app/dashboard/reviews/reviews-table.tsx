'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#64748b']
const RATING_NUM = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const

function nameToColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(h) % COLORS.length]
}
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function formatDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

type Status = 'pending' | 'replied' | 'ignored'

const STATUS_STYLES: Record<Status, string> = {
  replied: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  ignored: 'bg-slate-50 text-slate-500 border border-slate-200',
}
const STATUS_LABEL: Record<Status, string> = {
  replied: 'Replied',
  pending: 'Pending',
  ignored: 'Ignored',
}

const STAR_OPTIONS = [5, 4, 3, 2, 1]
const STATUS_OPTIONS: (Status | 'All')[] = ['All', 'pending', 'replied', 'ignored']
const DATE_OPTIONS = [
  { label: 'Last 7 days',  days: 7   },
  { label: 'Last 30 days', days: 30  },
  { label: 'All time',     days: 9999 },
]

function Stars({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={i < count ? '#D97706' : '#E2E8F0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export default function ReviewsTable() {
  const [starFilter,   setStarFilter]   = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')
  const [dateFilter,   setDateFilter]   = useState(9999)

  const reviews = useQuery(api.reviews.list, { limit: 50 }) ?? []

  const filtered = reviews.filter(r => {
    if (starFilter   !== null  && RATING_NUM[r.starRating] !== starFilter) return false
    if (statusFilter !== 'All' && r.status !== statusFilter)               return false
    const days = (Date.now() - new Date(r.updateTime).getTime()) / 86_400_000
    if (days > dateFilter)                                                  return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Stars:</span>
          <button
            onClick={() => setStarFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${starFilter === null ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
          >All</button>
          {STAR_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${starFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >{'★'.repeat(s)}</button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Status:</span>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >{s === 'All' ? 'All' : STATUS_LABEL[s]}</button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Period:</span>
          {DATE_OPTIONS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setDateFilter(days)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${dateFilter === days ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_1fr_2fr_1fr_1fr_auto] border-b border-slate-100 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Customer</span><span>Rating</span><span>Review</span>
          <span>Status</span><span>Date</span><span></span>
        </div>

        {reviews.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No reviews yet — connect Google Business to sync.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No reviews match the selected filters.
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r._id}
              className="grid grid-cols-[1.5fr_1fr_2fr_1fr_1fr_auto] items-center border-b border-slate-50 px-6 py-4 last:border-0 hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: nameToColor(r.reviewerName) }}
                >
                  {getInitials(r.reviewerName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.reviewerName}</p>
                  <p className="text-[11px] text-slate-400">via Google</p>
                </div>
              </div>
              <Stars count={RATING_NUM[r.starRating]} />
              <p className="truncate pr-4 text-[13px] text-slate-600">{r.comment ?? '—'}</p>
              <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
              <p className="text-[12px] text-slate-400">{formatDate(r.updateTime)}</p>
              {r.status === 'pending' ? (
                <button className="cursor-pointer whitespace-nowrap rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  Generate reply
                </button>
              ) : (
                <button className="cursor-pointer whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                  View reply
                </button>
              )}
            </div>
          ))
        )}

        <div className="px-6 py-3 text-center text-xs text-slate-400">
          Showing {filtered.length} of {reviews.length}
        </div>
      </div>
    </div>
  )
}
