'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#64748b']
const RATING_NUM = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const
const AVG_INTERVAL_MS = 19.5 * 60 * 1000

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
function formatAbsoluteTime(ts: number): string {
  const d    = new Date(ts)
  const now  = new Date()
  const tom  = new Date(); tom.setDate(now.getDate() + 1)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `Today at ${time}`
  if (d.toDateString() === tom.toDateString()) return `Tomorrow at ${time}`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ` at ${time}`
}
function formatScheduledCard(scheduledAt: number): string {
  const ms = scheduledAt - Date.now()
  if (ms <= 0) return 'Publishing soon'
  if (ms < 60 * 60 * 1000) return `Publishing in ~${Math.round(ms / 60_000)} min`
  return `Scheduled for ${formatAbsoluteTime(scheduledAt)}`
}
function estimatedCompletion(count: number, startAt: number): string {
  if (count === 0) return ''
  const end = new Date(startAt + (count - 1) * AVG_INTERVAL_MS)
  return formatAbsoluteTime(end.getTime())
}
function defaultTodayTime(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000)
  const m = Math.ceil(d.getMinutes() / 15) * 15
  if (m >= 60) { d.setHours(d.getHours() + 1); d.setMinutes(0) } else d.setMinutes(m)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function tomorrowDateStr(): string {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
function computeStartAt(
  mode: 'now' | 'today' | 'tomorrow' | 'custom',
  todayTime: string,
  tomorrowTime: string,
  customDate: string,
  customTime: string,
): number {
  if (mode === 'now') return Date.now()
  if (mode === 'today') {
    const [h, m] = todayTime.split(':').map(Number)
    const d = new Date(); d.setHours(h, m, 0, 0)
    return Math.max(d.getTime(), Date.now())
  }
  if (mode === 'tomorrow') {
    const [h, m] = tomorrowTime.split(':').map(Number)
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0)
    return d.getTime()
  }
  const [h, m] = customTime.split(':').map(Number)
  const d = new Date(customDate); d.setHours(h, m, 0, 0)
  return Math.max(d.getTime(), Date.now())
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

type ScheduleMode = 'now' | 'today' | 'tomorrow' | 'custom'
type Item = NonNullable<ReturnType<typeof useQuery<typeof api.replies.listDraftsWithReviews>>>[number]

// ─── Queue confirm modal ──────────────────────────────────────────────────────

function QueueConfirmModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const [openedAt]  = useState(() => Date.now())
  const completion  = estimatedCompletion(count, openedAt)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Queue {count} {count === 1 ? 'reply' : 'replies'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Publishing cadence</p>
            <p className="mt-1 text-[13px] font-medium text-slate-700">Every 12–27 minutes automatically</p>
          </div>

          {count > 1 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estimated completion</p>
              <p className="mt-1 text-[13px] font-medium text-slate-700">{completion}</p>
            </div>
          )}

          <div className="rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-[12px] leading-relaxed text-slate-500">
              Replies will be published gradually to maintain a natural posting pattern.
              Replyfier spaces out replies instead of publishing everything at once.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-full bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Confirm queue
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule modal ───────────────────────────────────────────────────────────

function ScheduleModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number
  onConfirm: (startAt: number) => void
  onCancel: () => void
}) {
  const [mode,         setMode]       = useState<ScheduleMode>('tomorrow')
  const [todayTime,    setTodayTime]  = useState(defaultTodayTime)
  const [tomorrowTime, setTomTime]    = useState('09:00')
  const [customDate,   setCustomDate] = useState(tomorrowDateStr)
  const [customTime,   setCustomTime] = useState('09:00')

  const startAt    = computeStartAt(mode, todayTime, tomorrowTime, customDate, customTime)
  const completion = estimatedCompletion(count, startAt)

  const MODES: { value: ScheduleMode; label: string }[] = [
    { value: 'now',      label: 'Queue now'   },
    { value: 'today',    label: 'Today at'    },
    { value: 'tomorrow', label: 'Tomorrow at' },
    { value: 'custom',   label: 'Custom date' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Schedule replies</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2.5">
          {MODES.map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                checked={mode === value}
                onChange={() => setMode(value)}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="w-28 text-[13px] font-medium text-slate-700">{label}</span>
              {value === 'today' && mode === 'today' && (
                <input type="time" value={todayTime} onChange={e => setTodayTime(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              )}
              {value === 'tomorrow' && mode === 'tomorrow' && (
                <input type="time" value={tomorrowTime} onChange={e => setTomTime(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              )}
              {value === 'custom' && mode === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input type="date" value={customDate} min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setCustomDate(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              )}
            </label>
          ))}
        </div>

        {count > 1 && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[12px] text-slate-500">
              Estimated completion: <span className="font-semibold text-slate-700">{completion}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{count} replies spaced ~12–27 min apart</p>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-[12px] text-slate-500">
            Replies will be published gradually to maintain a natural posting pattern.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button onClick={onCancel}
            className="cursor-pointer rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300">
            Cancel
          </button>
          <button onClick={() => onConfirm(startAt)}
            className="cursor-pointer rounded-full bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Confirm scheduling
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DraftQueue() {
  const [selected,          setSelected]          = useState<Set<Id<'replies'>>>(new Set())
  const [queuing,           setQueuing]           = useState(false)
  const [discarding,        setDiscarding]        = useState(false)
  const [showQueueConfirm,  setShowQueueConfirm]  = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [toast,             setToast]             = useState<string | null>(null)

  const rawItems      = useQuery(api.replies.listDraftsWithReviews)
  const aiSettings    = useQuery(api.aiSettings.get)
  const queueReplies  = useMutation(api.replies.queueReplies)
  const discardDrafts = useMutation(api.replies.discardDrafts)
  const updateDraft   = useMutation(api.replies.updateDraft)

  const items       = useMemo(() => rawItems ?? [],                                 [rawItems])
  const draftItems  = useMemo(() => items.filter(i => i.reply.status === 'draft'),  [items])
  const queuedItems = useMemo(() => items.filter(i => i.reply.status === 'queued'), [items])

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
    setSelected(allSelected ? new Set() : new Set(allDraftIds))
  }
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleQueue(startAt?: number) {
    if (selected.size === 0) return
    setQueuing(true)
    try {
      await queueReplies({ replyIds: [...selected], startAt })
      const count = selected.size
      setSelected(new Set())
      const label = startAt && startAt > Date.now() + 60_000
        ? `${count} ${count === 1 ? 'reply' : 'replies'} scheduled for ${formatAbsoluteTime(startAt)}.`
        : `${count} ${count === 1 ? 'reply' : 'replies'} queued for progressive publishing.`
      showToast(label)
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
  async function handleQueueSingle(replyId: Id<'replies'>) {
    await queueReplies({ replyIds: [replyId] })
    showToast('Reply queued for progressive publishing.')
  }
  async function handleRegenerate(reply: Item['reply'], review: Item['review']) {
    const res = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review:              review.comment ?? '',
        tone:                aiSettings?.tone,
        replyLength:         aiSettings?.replyLength,
        businessDescription: aiSettings?.businessDescription,
        signature:           aiSettings?.signature,
        customInstructions:  aiSettings?.customInstructions,
      }),
    })
    const data = await res.json() as { reply?: string; error?: string }
    if (!res.ok || !data.reply) throw new Error(data.error ?? 'Failed to generate reply')
    await updateDraft({ replyId: reply._id, draft: data.reply })
  }
  async function handleSaveEdit(replyId: Id<'replies'>, text: string) {
    await updateDraft({ replyId, draft: text })
  }

  if (rawItems === undefined) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-400">
          No draft replies yet — generate replies from the Awaiting reply page.
        </p>
      </div>
    )
  }

  return (
    <div className="relative pb-28">

      {showQueueConfirm && (
        <QueueConfirmModal
          count={selected.size}
          onCancel={() => setShowQueueConfirm(false)}
          onConfirm={() => { setShowQueueConfirm(false); handleQueue() }}
        />
      )}
      {showScheduleModal && (
        <ScheduleModal
          count={selected.size}
          onCancel={() => setShowScheduleModal(false)}
          onConfirm={startAt => { setShowScheduleModal(false); handleQueue(startAt) }}
        />
      )}

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

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
              onQueueSingle={() => handleQueueSingle(reply._id)}
              onSaveEdit={(text) => handleSaveEdit(reply._id, text)}
              onRegenerate={() => handleRegenerate(reply, review)}
            />
          ))}
        </div>
      )}

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

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
            <span className="self-center text-sm font-semibold text-slate-700">
              {selected.size} {selected.size === 1 ? 'reply' : 'replies'} selected
            </span>
            <div className="h-4 w-px self-center bg-slate-200" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQueueConfirm(true)}
                  disabled={queuing || discarding}
                  className="cursor-pointer whitespace-nowrap rounded-full bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {queuing ? 'Queuing…' : 'Queue selected replies'}
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  disabled={queuing || discarding}
                  className="cursor-pointer whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
                >
                  Schedule for later
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={queuing || discarding}
                  className="cursor-pointer whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                >
                  {discarding ? 'Discarding…' : 'Discard'}
                </button>
              </div>
              <p className="px-1 text-[11px] text-slate-400">
                Replies will be published gradually to maintain a natural posting pattern.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Draft card ───────────────────────────────────────────────────────────────

function DraftCard({
  reply, review, selected, onToggle, onQueueSingle, onSaveEdit, onRegenerate,
}: {
  reply: Item['reply']
  review: Item['review']
  selected: boolean
  onToggle: () => void
  onQueueSingle: () => void
  onSaveEdit: (text: string) => Promise<void>
  onRegenerate: () => Promise<void>
}) {
  const [expanded,     setExpanded]     = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [editText,     setEditText]     = useState(reply.draft)
  const [saving,       setSaving]       = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError,   setRegenError]   = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    try {
      await onSaveEdit(editText)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }
  async function handleRegenerate() {
    setRegenerating(true)
    setRegenError(null)
    try {
      await onRegenerate()
    } catch (e) {
      setRegenError(e instanceof Error ? e.message : 'Failed to regenerate')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition ${selected ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
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

          {/* Draft reply box */}
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
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            )}

            {regenError && (
              <p className="mt-1.5 text-[11px] text-red-500">{regenError}</p>
            )}

            {/* Card actions */}
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
                  <button onClick={onQueueSingle}
                    className="cursor-pointer rounded-full bg-blue-600 px-3.5 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700">
                    Queue reply
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
          Draft
        </span>
      </div>
    </div>
  )
}

// ─── Queued card ──────────────────────────────────────────────────────────────

function QueuedCard({ reply, review }: { reply: Item['reply']; review: Item['review'] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
      <div className="flex items-start gap-4 px-5 py-4">
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
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[11px] font-semibold text-slate-500">
                {reply.scheduledAt ? formatScheduledCard(reply.scheduledAt) : 'Queued'}
              </span>
            </div>
            <p className={`text-[13px] leading-relaxed text-slate-500 ${!expanded ? 'line-clamp-2' : ''}`}>
              {reply.draft}
            </p>
            {reply.draft.length > 120 && (
              <button onClick={() => setExpanded(e => !e)} className="mt-1 text-[11px] font-medium text-slate-400 hover:text-slate-600">
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
