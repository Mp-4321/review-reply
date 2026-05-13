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

const STATUS_STYLES: Record<string, string> = {
  replied: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  ignored: 'bg-slate-50 text-slate-500 border border-slate-200',
}
const STATUS_LABEL: Record<string, string> = {
  replied: 'Replied',
  pending: 'Pending',
  ignored: 'Ignored',
}

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

export default function RecentReplies() {
  const [expanded, setExpanded] = useState(false)
  const reviews = useQuery(api.reviews.list, { limit: 12 }) ?? []
  const rows = expanded ? reviews : reviews.slice(0, 5)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 pb-1 pt-4">
        <h2 className="text-base font-semibold text-slate-900">Recent reviews</h2>
        <button
          onClick={() => setExpanded(e => !e)}
          className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Show less' : 'View all'}
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-400">
          {reviews === undefined
            ? 'Loading reviews…'
            : 'No reviews yet — connect Google Business to sync.'}
        </div>
      ) : (
        <>
          <div className="mt-0 grid grid-cols-[1.5fr_1fr_1fr_4fr_1fr] border-b border-slate-100 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Customer</span>
            <span>Rating</span>
            <span>Status</span>
            <span>Reply</span>
            <span>Date</span>
          </div>

          {rows.map((r) => (
            <div
              key={r._id}
              className="grid grid-cols-[1.5fr_1fr_1fr_4fr_1fr] items-center border-b border-slate-50 px-6 py-3.5 last:border-0 hover:bg-slate-50/60"
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
              <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
              <p className="truncate pr-4 text-[13px] text-slate-500">
                {r.replyComment
                  ? r.replyComment.slice(0, 55) + (r.replyComment.length > 55 ? '…' : '')
                  : r.comment ? `"${r.comment.slice(0, 55)}…"` : '—'}
              </p>
              <p className="text-[12px] text-slate-400">{formatDate(r.updateTime)}</p>
            </div>
          ))}

          <div className="px-6 py-3 text-center text-xs text-slate-400">
            Showing {rows.length} of {reviews.length}
          </div>
        </>
      )}
    </div>
  )
}
