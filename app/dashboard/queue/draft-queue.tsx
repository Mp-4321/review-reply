'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

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
function formatTime(ts: number): string {
  const d   = new Date(ts)
  const now = new Date()
  const tom = new Date(); tom.setDate(now.getDate() + 1)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `Today at ${time}`
  if (d.toDateString() === tom.toDateString()) return `Tomorrow at ${time}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`
}
function formatScheduleLabel(scheduledAt: number): string {
  const ms  = scheduledAt - Date.now()
  if (ms > 0 && ms < 60 * 60 * 1000) return `Publishing in ~${Math.max(1, Math.round(ms / 60_000))} min`
  const d   = new Date(scheduledAt)
  const now = new Date()
  const tom = new Date(); tom.setDate(now.getDate() + 1)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `Publishing today at ${time}`
  if (d.toDateString() === tom.toDateString()) return `Publishing tomorrow at ${time}`
  return `Publishing on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

type Item = NonNullable<ReturnType<typeof useQuery<typeof api.replies.listDraftsWithReviews>>>[number]

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

// ─── Queue card ───────────────────────────────────────────────────────────────

function QueueCard({ reply, review }: { reply: Item['reply']; review: Item['review'] }) {
  const [expanded,   setExpanded]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [removing,   setRemoving]   = useState(false)
  const [rewriting,  setRewriting]  = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const removeFromQueue = useMutation(api.replies.removeFromQueue)
  const updateDraft     = useMutation(api.replies.updateDraft)
  const queueReplies    = useMutation(api.replies.queueReplies)
  const aiSettings      = useQuery(api.aiSettings.get)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleRemove() {
    setRemoving(true)
    try { await removeFromQueue({ replyId: reply._id }) }
    finally { setRemoving(false); setMenuOpen(false) }
  }

  async function handleRewrite() {
    setRewriting(true)
    try {
      const res = await fetch('/api/generate-reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          review:              review.comment ?? '',
          tone:                aiSettings?.tone,
          replyLength:         aiSettings?.replyLength,
          businessDescription: aiSettings?.businessDescription,
          signature:           aiSettings?.signature,
          customInstructions:  aiSettings?.customInstructions,
        }),
      })
      const data = await res.json() as { reply?: string }
      if (data.reply) {
        await updateDraft({ replyId: reply._id, draft: data.reply })
        await queueReplies({ replyIds: [reply._id as Id<'replies'>] })
      }
    } finally {
      setRewriting(false)
    }
  }

  const isNeedsReview = reply.status === 'needs_review'

  const scheduleLabel = isNeedsReview
    ? 'Held — similarity check flagged this reply'
    : reply.scheduledAt
      ? formatScheduleLabel(reply.scheduledAt)
      : 'Queued for publishing'

  const scheduleIcon = isNeedsReview ? (
    <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${isNeedsReview ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-start gap-4 px-5 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: nameToColor(review.reviewerName) }}
        >
          {getInitials(review.reviewerName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
            <Stars count={RATING_NUM[review.starRating]} />
            <span className="text-[11px] text-slate-400">{formatDate(review.createTime)}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-600 line-clamp-2">
            {review.comment ?? <span className="italic text-slate-400">No comment left.</span>}
          </p>

          <div className={`mt-3 rounded-xl border px-4 pt-3 pb-0 ${isNeedsReview ? 'border-red-100 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="mb-1.5 flex items-center gap-1.5">
              {scheduleIcon}
              <span className={`text-[11px] font-semibold ${isNeedsReview ? 'text-red-600' : 'text-blue-700'}`}>
                {scheduleLabel}
              </span>
            </div>
            <p className={`text-[13px] leading-relaxed text-slate-700 ${!expanded ? 'line-clamp-2' : ''}`}>
              {rewriting ? <span className="italic text-slate-400">Rewriting…</span> : reply.draft}
            </p>
            {!rewriting && reply.draft.length > 120 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className={`mt-1 text-[11px] font-medium ${isNeedsReview ? 'text-red-500 hover:text-red-700' : 'text-blue-600 hover:text-blue-700'}`}
              >
                {expanded ? 'Collapse reply' : 'Expand reply'}
              </button>
            )}

            {/* Controls — centered at bottom of preview box, matching Inbox Manage button position */}
            <div className="mt-1 mb-0 flex h-7 items-center justify-center">
              {isNeedsReview ? (
                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={rewriting}
                  className="cursor-pointer rounded-full border border-red-200 bg-white px-4 py-1 text-[11px] font-medium text-slate-500 shadow-sm transition hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-60"
                >
                  {rewriting ? 'Rewriting…' : 'Rewrite'}
                </button>
              ) : (
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(o => !o)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                    aria-label="More options"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute left-1/2 top-full z-20 mt-1 w-44 -translate-x-1/2 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
                      <button
                        type="button"
                        onClick={handleRemove}
                        disabled={removing}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {removing ? 'Removing…' : 'Remove from queue'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QueueMonitor() {
  const rawItems = useQuery(api.replies.listDraftsWithReviews)

  if (rawItems === undefined) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const items = rawItems.filter(i =>
    i.reply.status === 'queued' ||
    i.reply.status === 'approved' ||
    i.reply.status === 'needs_review'
  )

  if (items.length === 0) {
    return (
      <div className="max-w-[1300px] rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-400">
          No replies in the queue — approve drafts from your Inbox to start publishing.
        </p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    if (a.reply.status === 'needs_review' && b.reply.status !== 'needs_review') return -1
    if (b.reply.status === 'needs_review' && a.reply.status !== 'needs_review') return 1
    return (a.reply.scheduledAt ?? Infinity) - (b.reply.scheduledAt ?? Infinity)
  })

  const needsReviewCount = sorted.filter(i => i.reply.status === 'needs_review').length
  const queuedCount      = sorted.length - needsReviewCount

  return (
    <div className="max-w-[1300px]">
      {/* Summary bar */}
      <div className="mb-5 flex flex-wrap items-center gap-4">
        {queuedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{queuedCount}</span> queued
            </span>
          </div>
        )}
        {needsReviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{needsReviewCount}</span> need review
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map(({ reply, review }) => (
          <QueueCard key={reply._id} reply={reply} review={review} />
        ))}
      </div>
    </div>
  )
}
