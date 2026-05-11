'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id, Doc } from '@/convex/_generated/dataModel'

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

type SortOption = 'newest' | 'oldest' | 'lowest' | 'highest'
const STAR_OPTS: (number | null)[] = [null, 5, 4, 3, 2, 1]
const SORT_OPTS: { label: string; value: SortOption }[] = [
  { label: 'Newest first',   value: 'newest'  },
  { label: 'Oldest first',   value: 'oldest'  },
  { label: 'Lowest rating',  value: 'lowest'  },
  { label: 'Highest rating', value: 'highest' },
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

export default function AwaitingReplyQueue() {
  const [starFilter,    setStarFilter]    = useState<number | null>(null)
  const [sort,          setSort]          = useState<SortOption>('newest')
  const [expanded,      setExpanded]      = useState<Id<'reviews'> | null>(null)
  const [dismissed,     setDismissed]     = useState<Id<'reviews'>[]>([])
  const [generatingFor, setGeneratingFor] = useState<Id<'reviews'> | null>(null)
  const [editingFor,    setEditingFor]    = useState<Id<'reviews'> | null>(null)
  const [editText,      setEditText]      = useState('')
  const [error,         setError]         = useState<string | null>(null)

  const reviews    = useQuery(api.reviews.list, { status: 'pending', limit: 50 }) ?? []
  const allDrafts  = useQuery(api.replies.listDrafts) ?? []
  const aiSettings = useQuery(api.aiSettings.get)
  const saveDraft    = useMutation(api.replies.save)
  const updateDraft  = useMutation(api.replies.updateDraft)
  const approveDraft = useMutation(api.replies.approve)

  // Map reviewId → latest draft reply
  const draftMap = new Map<string, Doc<'replies'>>()
  for (const d of allDrafts) draftMap.set(d.reviewId, d)

  const visible = reviews
    .filter(r => !dismissed.includes(r._id))
    .filter(r => starFilter === null || RATING_NUM[r.starRating] === starFilter)
    .sort((a, b) => {
      if (sort === 'lowest')  return RATING_NUM[a.starRating] - RATING_NUM[b.starRating]
      if (sort === 'highest') return RATING_NUM[b.starRating] - RATING_NUM[a.starRating]
      if (sort === 'oldest')  return new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    })

  async function generate(review: typeof reviews[number], regenerate = false) {
    setGeneratingFor(review._id)
    setExpanded(review._id)
    setError(null)
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review:             review.comment ?? '',
          tone:               aiSettings?.tone,
          replyLength:        aiSettings?.replyLength,
          businessDescription: aiSettings?.businessDescription,
          signature:          aiSettings?.signature,
          customInstructions: aiSettings?.customInstructions,
        }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok || !data.reply) throw new Error(data.error ?? 'Failed to generate reply')

      const existing = draftMap.get(review._id)
      if (regenerate && existing) {
        await updateDraft({ replyId: existing._id, draft: data.reply })
      } else {
        await saveDraft({ reviewId: review._id, draft: data.reply })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setGeneratingFor(null)
    }
  }

  async function saveEdit(review: typeof reviews[number]) {
    const existing = draftMap.get(review._id)
    if (!existing) return
    await updateDraft({ replyId: existing._id, draft: editText })
    setEditingFor(null)
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Stars:</span>
          {STAR_OPTS.map(s => (
            <button
              key={s ?? 'all'}
              onClick={() => setStarFilter(s)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${
                starFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {s === null ? 'All' : '★'.repeat(s)}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Queue */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-400">
            {reviews.length === 0
              ? 'No reviews yet — connect Google Business to sync.'
              : 'All caught up — no reviews awaiting a reply.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => {
            const draft     = draftMap.get(r._id)
            const isLoading = generatingFor === r._id
            const isEditing = editingFor === r._id

            return (
              <div
                key={r._id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-5 px-6 py-5">
                  {/* Avatar + stars */}
                  <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: nameToColor(r.reviewerName) }}
                    >
                      {getInitials(r.reviewerName)}
                    </div>
                    <Stars count={RATING_NUM[r.starRating]} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{r.reviewerName}</p>
                      <span className="text-[11px] text-slate-400">via Google</span>
                      <span className="text-[11px] text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400">{formatDate(r.createTime)}</span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-slate-600">
                      {r.comment ?? <span className="italic text-slate-400">No comment left.</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2.5">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                      Pending
                    </span>
                    {draft ? (
                      <button
                        onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                        className="cursor-pointer whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        {expanded === r._id ? 'Hide draft' : 'View draft'}
                      </button>
                    ) : (
                      <button
                        onClick={() => generate(r)}
                        disabled={isLoading}
                        className="cursor-pointer whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isLoading ? 'Generating…' : 'Generate reply'}
                      </button>
                    )}
                    <button
                      onClick={() => setDismissed(prev => [...prev, r._id])}
                      className="cursor-pointer text-[11px] text-slate-400 transition hover:text-slate-600"
                    >
                      Mark as resolved
                    </button>
                  </div>
                </div>

                {/* Draft panel */}
                {expanded === r._id && (
                  <div className="mx-6 mb-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                    <div className="mb-2.5 flex items-center gap-1.5 text-blue-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-xs font-semibold">
                        {isLoading ? 'Generating reply…' : 'AI-generated reply'}
                      </span>
                    </div>

                    {isLoading ? (
                      <div className="h-12 animate-pulse rounded-lg bg-blue-100" />
                    ) : isEditing ? (
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <p className="text-[13px] leading-relaxed text-slate-700">{draft?.draft}</p>
                    )}

                    {!isLoading && (
                      <div className="mt-3.5 flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(r)}
                              className="cursor-pointer rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFor(null)}
                              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => draft && approveDraft({ replyId: draft._id })}
                              className="cursor-pointer rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setEditText(draft?.draft ?? '')
                                setEditingFor(r._id)
                              }}
                              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => generate(r, true)}
                              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
                            >
                              Regenerate
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
