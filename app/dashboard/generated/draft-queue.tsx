'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

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
function formatScheduled(scheduledAt: number) {
  const ms = scheduledAt - Date.now()
  if (ms <= 0) return 'Publishing soon'
  const min = Math.round(ms / 60_000)
  if (min < 60) return `In ~${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `In ~${h}h ${m}min` : `In ~${h}h`
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

export default function DraftQueue() {
  const [selected,   setSelected]   = useState<Set<Id<'replies'>>>(new Set())
  const [queuing,    setQueuing]    = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [toast,      setToast]      = useState<string | null>(null)

  const rawItems    = useQuery(api.replies.listDraftsWithReviews)
  const queueReplies  = useMutation(api.replies.queueReplies)
  const discardDrafts = useMutation(api.replies.discardDrafts)

  const items       = useMemo(() => rawItems ?? [],                                         [rawItems])
  const draftItems  = useMemo(() => items.filter(i => i.reply.status === 'draft'),          [items])
  const queuedItems = useMemo(() => items.filter(i => i.reply.status === 'queued'),         [items])

  const allDraftIds = draftItems.map(i => i.reply._id)
  const allSelected = allDraftIds.length > 0 && allDraftIds.every(id => selected.has(id))

  function toggleSelect(id: Id<'replies'>) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allDraftIds))
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleQueue() {
    if (selected.size === 0) return
    setQueuing(true)
    try {
      await queueReplies({ replyIds: [...selected] })
      setSelected(new Set())
      showToast(`${selected.size} ${selected.size === 1 ? 'reply' : 'replies'} queued for progressive publishing.`)
    } finally {
      setQueuing(false)
    }
  }

  async function handleDiscard() {
    if (selected.size === 0) return
    setDiscarding(true)
    try {
      await discardDrafts({ replyIds: [...selected] })
      setSelected(new Set())
      showToast('Drafts discarded.')
    } finally {
      setDiscarding(false)
    }
  }

  if (rawItems === undefined) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-400">No draft replies yet — generate replies from the Awaiting reply page.</p>
      </div>
    )
  }

  return (
    <div className="relative pb-24">

      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Select all row */}
      {draftItems.length > 0 && (
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
          />
          <span className="text-[13px] text-slate-500">
            {allSelected ? 'Deselect all' : `Select all ${draftItems.length} drafts`}
          </span>
        </div>
      )}

      {/* Draft items */}
      {draftItems.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Drafts — {draftItems.length}
          </p>
          {draftItems.map(({ reply, review }) => (
            <DraftCard
              key={reply._id}
              reply={reply}
              review={review}
              selected={selected.has(reply._id)}
              onToggle={() => toggleSelect(reply._id)}
            />
          ))}
        </div>
      )}

      {/* Queued items */}
      {queuedItems.length > 0 && (
        <div className="space-y-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Queued — publishing gradually
          </p>
          {queuedItems.map(({ reply, review }) => (
            <QueuedCard key={reply._id} reply={reply} review={review} />
          ))}
        </div>
      )}

      {/* Sticky bulk toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xl">
            <span className="text-sm font-semibold text-slate-700">
              {selected.size} {selected.size === 1 ? 'reply' : 'replies'} selected
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex flex-col items-start">
              <button
                onClick={handleQueue}
                disabled={queuing || discarding}
                className="cursor-pointer whitespace-nowrap rounded-full bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                {queuing ? 'Queuing…' : 'Queue selected replies'}
              </button>
              <p className="mt-1 px-1 text-[11px] text-slate-400">
                Replies will be published gradually to maintain a natural posting pattern.
              </p>
            </div>
            <button
              onClick={handleDiscard}
              disabled={queuing || discarding}
              className="cursor-pointer whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
            >
              {discarding ? 'Discarding…' : 'Discard drafts'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type Item = NonNullable<ReturnType<typeof useQuery<typeof api.replies.listDraftsWithReviews>>>[number]

function DraftCard({
  reply, review, selected, onToggle,
}: {
  reply: Item['reply']
  review: Item['review']
  selected: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition ${
        selected ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
        />

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: nameToColor(review.reviewerName) }}
        >
          {getInitials(review.reviewerName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
            <Stars count={RATING_NUM[review.starRating]} />
            <span className="text-[11px] text-slate-400">{formatDate(review.createTime)}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-600 line-clamp-2">
            {review.comment ?? <span className="italic text-slate-400">No comment left.</span>}
          </p>

          {/* Draft reply */}
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-semibold text-blue-600">Draft reply</span>
            </div>
            <p className={`text-[13px] leading-relaxed text-slate-700 ${!expanded ? 'line-clamp-2' : ''}`}>
              {reply.draft}
            </p>
            {reply.draft.length > 120 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-1 text-[11px] font-medium text-blue-500 hover:text-blue-700"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
          Draft
        </span>
      </div>
    </div>
  )
}

function QueuedCard({ reply, review }: { reply: Item['reply']; review: Item['review'] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 shadow-sm opacity-90">
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Spacer to align with draft cards */}
        <div className="h-4 w-4 shrink-0" />

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: nameToColor(review.reviewerName) }}
        >
          {getInitials(review.reviewerName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <p className="text-sm font-semibold text-slate-700">{review.reviewerName}</p>
            <Stars count={RATING_NUM[review.starRating]} />
            <span className="text-[11px] text-slate-400">{formatDate(review.createTime)}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-500 line-clamp-2">
            {review.comment ?? <span className="italic">No comment left.</span>}
          </p>

          {/* Queued reply */}
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[11px] font-semibold text-slate-500">
                {reply.scheduledAt ? formatScheduled(reply.scheduledAt) : 'Queued'}
              </span>
            </div>
            <p className={`text-[13px] leading-relaxed text-slate-500 ${!expanded ? 'line-clamp-2' : ''}`}>
              {reply.draft}
            </p>
            {reply.draft.length > 120 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-1 text-[11px] font-medium text-slate-400 hover:text-slate-600"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
          Queued
        </span>
      </div>
    </div>
  )
}
