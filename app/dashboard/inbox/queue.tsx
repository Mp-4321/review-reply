'use client'

import { useState, useMemo, useRef, useEffect, useSyncExternalStore } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { Id } from '@/convex/_generated/dataModel'
import Link from 'next/link'

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
const SORT_OPTS: { label: string; value: SortOption }[] = [
  { label: 'Newest first',   value: 'newest'  },
  { label: 'Oldest first',   value: 'oldest'  },
  { label: 'Low rating',     value: 'lowest'  },
  { label: 'High rating',    value: 'highest' },
]
const WORKFLOW_KEY = 'replyfier.workflowSettings'

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

// ─── Auto-generate status bar ─────────────────────────────────────────────────

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('replyfier:workflowChanged', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('replyfier:workflowChanged', callback)
  }
}
function readAutoGenerate() {
  try {
    const stored = window.localStorage.getItem(WORKFLOW_KEY)
    return stored ? (JSON.parse(stored).autoGenerateEnabled ?? false) : false
  } catch { return false }
}

function AutoGenerateBar({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <div className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
      <p className="text-xs font-semibold text-green-700">
        Auto-generate enabled
      </p>
      <Link
        href="/dashboard/workflow"
        className="shrink-0 text-[11px] font-medium text-slate-400 transition hover:text-slate-600"
      >
        Manage workflow →
      </Link>
    </div>
  ) : (
    <div className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
      <p className="text-xs font-semibold text-slate-600">
        Auto-generate disabled
      </p>
      <Link
        href="/dashboard/workflow"
        className="shrink-0 text-[11px] font-medium text-slate-400 transition hover:text-slate-600"
      >
        Manage workflow →
      </Link>
    </div>
  )
}

// ─── Inline draft card ────────────────────────────────────────────────────────

function InboxDraftCard({
  reply, review, onQueueSingle, onSaveEdit, onRegenerate,
}: {
  reply: Item['reply']
  review: Doc<'reviews'>
  onQueueSingle: () => Promise<void>
  onSaveEdit: (text: string) => Promise<void>
  onRegenerate: () => Promise<void>
}) {
  const [expanded,     setExpanded]     = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [editText,     setEditText]     = useState(reply.draft)
  const [saving,       setSaving]       = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError,   setRegenError]   = useState<string | null>(null)
  const [queueing,     setQueueing]     = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await onSaveEdit(editText); setEditing(false) }
    finally { setSaving(false) }
  }
  async function handleRegenerate() {
    setRegenerating(true); setRegenError(null)
    try { await onRegenerate() }
    catch (e) { setRegenError(e instanceof Error ? e.message : 'Failed to regenerate') }
    finally { setRegenerating(false) }
  }
  async function handleQueue() {
    setQueueing(true)
    try { await onQueueSingle() }
    finally { setQueueing(false) }
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4">
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

        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-[11px] font-semibold text-blue-600">Draft reply</span>
          </div>

          {regenerating ? (
            <div className="h-10 animate-pulse rounded-lg bg-blue-100" />
          ) : editing ? (
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          ) : (
            <>
              <p className={`text-[13px] leading-relaxed text-slate-700 ${!expanded ? 'line-clamp-2' : ''}`}>
                {reply.draft}
              </p>
              {reply.draft.length > 120 && (
                <button onClick={() => setExpanded(e => !e)} className="mt-1 text-[11px] font-medium text-blue-500 hover:text-blue-700">
                  {expanded ? 'Collapse reply' : 'Expand reply'}
                </button>
              )}
            </>
          )}

          {regenError && <p className="mt-1.5 text-[11px] text-red-500">{regenError}</p>}

          <div className="mt-3 flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="cursor-pointer rounded-full bg-blue-600 px-3.5 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditText(reply.draft) }}
                  className="cursor-pointer rounded-full border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-300">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(true); setEditText(reply.draft) }}
                  className="cursor-pointer rounded-full border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-slate-800">
                  Edit
                </button>
                <button onClick={handleRegenerate} disabled={regenerating}
                  className="cursor-pointer rounded-full border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-slate-800 disabled:opacity-60">
                  {regenerating ? 'Regenerating…' : 'Regenerate'}
                </button>
                <button onClick={handleQueue} disabled={queueing}
                  className="cursor-pointer rounded-full bg-blue-600 px-3.5 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {queueing ? 'Queuing…' : 'Queue reply'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── Pending card ─────────────────────────────────────────────────────────────

function PendingCard({
  review, isLoading, onGenerate,
}: {
  review: Doc<'reviews'>
  isLoading: boolean
  onGenerate: () => void
}) {
  return (
    <>
      <div className="flex items-start gap-5 px-6 py-5">
        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: nameToColor(review.reviewerName) }}
          >
            {getInitials(review.reviewerName)}
          </div>
          <Stars count={RATING_NUM[review.starRating]} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
            <span className="text-[11px] text-slate-400">via Google</span>
            <span className="text-[11px] text-slate-300">·</span>
            <span className="text-[11px] text-slate-400">{formatDate(review.createTime)}</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-slate-600">
            {review.comment ?? <span className="italic text-slate-400">No comment left.</span>}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            Needs reply
          </span>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="cursor-pointer whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? 'Generating…' : 'Generate reply'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mx-6 mb-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-blue-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-semibold">Generating reply…</span>
          </div>
          <div className="h-12 animate-pulse rounded-lg bg-blue-100" />
        </div>
      )}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InboxQueue({ focusReviewId }: { focusReviewId?: string }) {
  const [sort,          setSort]          = useState<SortOption>('newest')
  const [generatingSet, setGeneratingSet] = useState<Set<string>>(new Set())
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
  const [error,         setError]         = useState<string | null>(null)
  const [toast,         setToast]         = useState<string | null>(null)

  const autoGenerateEnabled = useSyncExternalStore(subscribe, readAutoGenerate, () => false)
  const didAutoGenerateRef  = useRef(false)

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const rawReviews = useQuery(api.reviews.list, { status: 'pending', limit: 50 })
  const rawItems   = useQuery(api.replies.listDraftsWithReviews)
  const aiSettings = useQuery(api.aiSettings.get)
  const saveDraft    = useMutation(api.replies.save)
  const updateDraft  = useMutation(api.replies.updateDraft)
  const queueReplies = useMutation(api.replies.queueReplies)

  const reviews = rawReviews ?? []

  const reviewDraftMap = useMemo(() => {
    const map = new Map<string, Item>()
    for (const item of (rawItems ?? [])) {
      if (item.reply.status === 'draft') map.set(item.reply.reviewId, item)
    }
    return map
  }, [rawItems])

  const queuedReviewIds = useMemo(() => {
    const set = new Set<string>()
    for (const { reply } of (rawItems ?? [])) {
      if (reply.status === 'queued' || reply.status === 'approved' || reply.status === 'needs_review') {
        set.add(reply.reviewId)
      }
    }
    return set
  }, [rawItems])

  const visible = reviews
    .filter(r => !queuedReviewIds.has(r._id))
    .sort((a, b) => {
      if (sort === 'lowest')  return RATING_NUM[a.starRating] - RATING_NUM[b.starRating]
      if (sort === 'highest') return RATING_NUM[b.starRating] - RATING_NUM[a.starRating]
      if (sort === 'oldest')  return new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    })

  // Selection
  const visibleIds    = visible.map(r => r._id as string)
  const allSelected   = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
  const someSelected  = selectedIds.size > 0

  const draftSelected   = [...selectedIds].filter(id => reviewDraftMap.has(id))
  const noDraftSelected = [...selectedIds].filter(id => !reviewDraftMap.has(id))
  const isMixed         = draftSelected.length > 0 && noDraftSelected.length > 0

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(visibleIds))
  }

  // Auto-scroll to focused review
  useEffect(() => {
    if (!focusReviewId || rawItems === undefined || rawReviews === undefined) return
    const el = cardRefs.current[focusReviewId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusReviewId, rawItems, rawReviews])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  // Auto-generate drafts when the setting is enabled
  useEffect(() => {
    if (!autoGenerateEnabled) {
      didAutoGenerateRef.current = false
      return
    }
    if (rawReviews === undefined || rawItems === undefined) return
    if (didAutoGenerateRef.current) return

    const toGenerate = rawReviews.filter(r =>
      !queuedReviewIds.has(r._id as string) && !reviewDraftMap.has(r._id as string)
    )
    if (toGenerate.length === 0) return

    didAutoGenerateRef.current = true
    void (async () => {
      let count = 0
      for (const r of toGenerate) {
        addGenerating(r._id as string)
        try {
          const draft = await callGenerateApi(r.comment ?? '')
          await saveDraft({ reviewId: r._id, draft })
          count++
        } catch {
          // continue with others
        } finally {
          removeGenerating(r._id as string)
        }
      }
      if (count > 0) showToast(`${count} draft${count !== 1 ? 's' : ''} auto-generated.`)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerateEnabled, rawReviews, rawItems])

  function addGenerating(id: string)    { setGeneratingSet(prev => new Set([...prev, id])) }
  function removeGenerating(id: string) { setGeneratingSet(prev => { const s = new Set(prev); s.delete(id); return s }) }

  async function callGenerateApi(comment: string): Promise<string> {
    const res = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review:              comment,
        tone:                aiSettings?.tone,
        replyLength:         aiSettings?.replyLength,
        businessDescription: aiSettings?.businessDescription,
        signature:           aiSettings?.signature,
        customInstructions:  aiSettings?.customInstructions,
      }),
    })
    const data = await res.json() as { reply?: string; error?: string }
    if (!res.ok || !data.reply) throw new Error(data.error ?? 'Failed to generate reply')
    return data.reply
  }

  async function generate(reviewId: Id<'reviews'>, comment: string) {
    addGenerating(reviewId as string)
    setError(null)
    try {
      const draft = await callGenerateApi(comment)
      await saveDraft({ reviewId, draft })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      removeGenerating(reviewId as string)
    }
  }

  async function handleBulkGenerate() {
    const toGenerate = visible.filter(r => noDraftSelected.includes(r._id as string))
    let success = 0
    for (const r of toGenerate) {
      addGenerating(r._id as string)
      try {
        const draft = await callGenerateApi(r.comment ?? '')
        await saveDraft({ reviewId: r._id, draft })
        success++
      } catch {} finally {
        removeGenerating(r._id as string)
      }
    }
    setSelectedIds(new Set())
    showToast(`${success} draft${success !== 1 ? 's' : ''} generated.`)
  }

  async function handleBulkRegenerate() {
    const toRegenerate = draftSelected
      .map(id => {
        const item = reviewDraftMap.get(id)
        const review = visible.find(r => (r._id as string) === id)
        return item && review ? { item, review } : null
      })
      .filter((entry): entry is { item: Item; review: Doc<'reviews'> } => entry !== null)

    if (toRegenerate.length === 0) return

    setError(null)
    toRegenerate.forEach(({ review }) => addGenerating(review._id as string))

    const results = await Promise.allSettled(
      toRegenerate.map(async ({ item, review }) => {
        const draft = await callGenerateApi(review.comment ?? '')
        await updateDraft({ replyId: item.reply._id, draft })
      })
    )

    toRegenerate.forEach(({ review }) => removeGenerating(review._id as string))

    const success = results.filter(result => result.status === 'fulfilled').length
    const failed = toRegenerate.length - success

    setSelectedIds(new Set())
    if (success > 0) showToast(`${success} draft${success !== 1 ? 's' : ''} regenerated`)
    if (failed > 0) setError(`${failed} draft${failed !== 1 ? 's' : ''} could not be regenerated.`)
  }

  async function handleBulkQueue() {
    const replyIds = draftSelected
      .map(id => reviewDraftMap.get(id)?.reply._id)
      .filter((id): id is Id<'replies'> => id !== undefined)
    await queueReplies({ replyIds })
    setSelectedIds(new Set())
    showToast(`${replyIds.length} repl${replyIds.length !== 1 ? 'ies' : 'y'} queued`)
  }

  async function handleRegenerate(reply: Item['reply'], review: Doc<'reviews'>) {
    const draft = await callGenerateApi(review.comment ?? '')
    await updateDraft({ replyId: reply._id, draft })
  }

  async function handleQueueSingle(replyId: Id<'replies'>) {
    await queueReplies({ replyIds: [replyId] })
    showToast('Reply queued')
  }

  if (rawItems === undefined || rawReviews === undefined) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <AutoGenerateBar enabled={autoGenerateEnabled} />

      {/* Filters */}
      <div className="relative mb-5">
        <div className="flex items-center gap-3">
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
              <input
                type="checkbox"
                checked={allSelected}
                disabled={visible.length === 0}
                onChange={toggleAll}
                className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-blue-600 disabled:cursor-not-allowed"
              />
              <span>{someSelected ? `${selectedIds.size} selected` : 'Select all'}</span>
            </label>

            {someSelected && (
              <div className="ml-4 flex flex-wrap items-center gap-2">
                {isMixed ? (
                  <span className="text-[12px] text-slate-400">Mixed selection</span>
                ) : noDraftSelected.length > 0 ? (
                  <button
                    onClick={handleBulkGenerate}
                    disabled={generatingSet.size > 0}
                    className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/10 transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    {generatingSet.size > 0 ? 'Generating...' : 'Generate selected'}
                  </button>
                ) : draftSelected.length > 0 ? (
                  <>
                    <button
                      onClick={handleBulkQueue}
                      className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/10 transition hover:bg-blue-600"
                    >
                      Queue selected
                    </button>
                    <button
                      onClick={handleBulkRegenerate}
                      disabled={generatingSet.size > 0}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
                    >
                      {generatingSet.size > 0 ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </>
                ) : null}
              </div>
            )}
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

          {toast && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-emerald-100 bg-white/95 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {toast}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-400">
            All caught up — no reviews need a reply right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => {
            const draftItem  = reviewDraftMap.get(r._id)
            const isFocused  = focusReviewId !== undefined && (r._id as string) === focusReviewId
            const isSelected = selectedIds.has(r._id as string)
            const isLoading  = generatingSet.has(r._id as string)

            return (
              <div key={r._id} className="group flex items-start gap-2">
                <div className="flex w-5 shrink-0 justify-center pt-5">
                  <label
                    className={`flex h-5 w-5 translate-x-[7px] cursor-pointer items-center justify-center transition duration-150 ${
                      someSelected || isSelected
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select review from ${r.reviewerName}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(r._id as string)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-blue-600 opacity-80 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    />
                  </label>
                </div>
                <div
                  ref={el => { cardRefs.current[r._id as string] = el }}
                  className={`flex-1 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-slate-200 border-l-blue-400 border-l-[3px] bg-blue-50/20'
                      : 'border-slate-200'
                  } ${isFocused ? 'ring-1 ring-blue-200' : ''}`}
                >
                  {draftItem ? (
                    <InboxDraftCard
                      reply={draftItem.reply}
                      review={r}
                      onQueueSingle={() => handleQueueSingle(draftItem.reply._id)}
                      onSaveEdit={async text => { await updateDraft({ replyId: draftItem.reply._id, draft: text }) }}
                      onRegenerate={() => handleRegenerate(draftItem.reply, r)}
                    />
                  ) : (
                    <PendingCard
                      review={r}
                      isLoading={isLoading}
                      onGenerate={() => generate(r._id, r.comment ?? '')}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
