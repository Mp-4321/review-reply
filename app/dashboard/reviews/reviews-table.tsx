'use client'

import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

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
function formatDate(iso: string, now: number) {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}
function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

type DisplayStatus = 'pending' | 'draft' | 'queued' | 'replied' | 'ignored' | 'needs_review'

const STATUS_STYLES: Record<DisplayStatus, string> = {
  pending:      'bg-amber-50 text-amber-700 border border-amber-200',
  draft:        'bg-violet-50 text-violet-700 border border-violet-200',
  queued:       'bg-sky-50 text-sky-700 border border-sky-200',
  replied:      'bg-green-50 text-green-700 border border-green-200',
  ignored:      'bg-slate-50 text-slate-500 border border-slate-200',
  needs_review: 'bg-red-50 text-red-700 border border-red-200',
}
const STATUS_LABEL: Record<DisplayStatus, string> = {
  pending:      'Pending',
  draft:        'Draft',
  queued:       'Queued',
  replied:      'Replied',
  ignored:      'Ignored',
  needs_review: 'Review',
}

const STAR_OPTIONS = [5, 4, 3, 2, 1]
const STATUS_OPTIONS: (DisplayStatus | 'All')[] = ['All', 'pending', 'draft', 'queued', 'replied']
const DATE_OPTIONS = [
  { label: 'Last 7 days',  days: 7    },
  { label: 'Last 30 days', days: 30   },
  { label: 'All time',     days: 9999 },
]

function ReplyModal({ review, onClose }: { review: Doc<'reviews'>; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      <div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Review &amp; Reply</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Customer review */}
        <div className="px-6 py-5">
          <div className="mb-3 flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: nameToColor(review.reviewerName) }}
            >
              {getInitials(review.reviewerName)}
            </div>
            <div className="flex flex-1 items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
                <div className="mt-0.5">
                  <Stars count={RATING_NUM[review.starRating]} />
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-slate-400">{formatFullDate(review.updateTime)}</span>
            </div>
          </div>
          {review.comment
            ? <p className="text-[13.5px] leading-relaxed text-slate-700">{review.comment}</p>
            : <p className="text-[13px] italic text-slate-400">No comment left.</p>
          }
        </div>

        <div className="mx-6 border-t border-slate-100" />

        {/* Published reply */}
        <div className="px-6 py-5">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your reply</p>
            {review.replyUpdateTime && (
              <span className="text-[11px] text-slate-400">{formatFullDate(review.replyUpdateTime)}</span>
            )}
          </div>
          {review.replyComment
            ? <p className="text-[13.5px] leading-relaxed text-slate-700">{review.replyComment}</p>
            : <p className="text-[13px] italic text-slate-400">No reply recorded.</p>
          }
        </div>
      </div>
    </div>
  )
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5 leading-none">
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
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'All'>('All')
  const [dateFilter,   setDateFilter]   = useState(9999)
  const [now] = useState(() => Date.now())
  const [viewReview, setViewReview] = useState<Doc<'reviews'> | null>(null)
  const router = useRouter()

  function handleRowClick(r: typeof reviews[number], displayStatus: DisplayStatus) {
    if (displayStatus === 'replied' || displayStatus === 'ignored') {
      setViewReview(r)
    } else if (displayStatus === 'pending' || displayStatus === 'draft') {
      router.push(`/dashboard/awaiting-reply?reviewId=${r._id}`)
    } else if (displayStatus === 'queued' || displayStatus === 'needs_review') {
      router.push('/dashboard/draft-replies')
    }
  }

  const reviews   = useQuery(api.reviews.list, { limit: 50 }) ?? []
  const rawDrafts = useQuery(api.replies.listDraftsWithReviews)

  // Map reviewId → display-level reply status
  const reviewReplyMap = useMemo(() => {
    const map = new Map<string, 'draft' | 'queued' | 'needs_review'>()
    for (const { reply } of (rawDrafts ?? [])) {
      if (reply.status === 'draft' || reply.status === 'queued' || reply.status === 'needs_review') {
        map.set(reply.reviewId, reply.status)
      }
    }
    return map
  }, [rawDrafts])

  function getDisplayStatus(r: typeof reviews[number]): DisplayStatus {
    if (r.status === 'replied') return 'replied'
    if (r.status === 'ignored') return 'ignored'
    return (reviewReplyMap.get(r._id) ?? 'pending') as DisplayStatus
  }

  const filtered = reviews.filter(r => {
    if (starFilter   !== null  && RATING_NUM[r.starRating] !== starFilter)  return false
    if (statusFilter !== 'All' && getDisplayStatus(r) !== statusFilter)     return false
    const days = (now - new Date(r.updateTime).getTime()) / 86_400_000
    if (days > dateFilter)                                                   return false
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
        <div className="grid grid-cols-[1.9fr_1fr_5fr_1.4fr_1fr] border-b border-slate-100 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Customer</span><span>Rating</span><span>Review</span>
          <span>Status</span><span>Date</span>
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
          filtered.map((r) => {
            const displayStatus = getDisplayStatus(r)

            return (
              <div
                key={r._id}
                role="button"
                tabIndex={0}
                aria-label={`View ${r.reviewerName}'s review`}
                onClick={() => handleRowClick(r, displayStatus)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleRowClick(r, displayStatus)}
                className="grid cursor-pointer grid-cols-[1.9fr_1fr_5fr_1.4fr_1fr] items-center border-b border-slate-50 px-6 py-3.5 last:border-0 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: nameToColor(r.reviewerName) }}
                  >
                    {getInitials(r.reviewerName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight text-slate-900">{r.reviewerName}</p>
                    <p className="text-[11px] leading-tight text-slate-400">via Google</p>
                  </div>
                </div>
                <Stars count={RATING_NUM[r.starRating]} />
                <p className="truncate pr-4 text-[13px] text-slate-600">
                  {r.comment ? r.comment.slice(0, 70) + (r.comment.length > 70 ? '…' : '') : '—'}
                </p>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[displayStatus]}${displayStatus === 'draft' ? ' min-w-[3.75rem] text-center' : ''}`}>
                  {STATUS_LABEL[displayStatus]}
                </span>
                <p className="text-[12px] text-slate-400">{formatDate(r.updateTime, now)}</p>
              </div>
            )
          })
        )}

        <div className="px-6 py-3 text-center text-xs text-slate-400">
          Showing {filtered.length} of {reviews.length}
        </div>
      </div>

      {viewReview && (
        <ReplyModal review={viewReview} onClose={() => setViewReview(null)} />
      )}
    </div>
  )
}
