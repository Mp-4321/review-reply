'use client'

import { useState } from 'react'

type SortOption = 'newest' | 'oldest' | 'lowest' | 'highest'

const REVIEWS = [
  {
    id: 1,
    initials: 'SL', color: '#6366f1',
    name: 'Sarah L.', date: 'Today, 9:41 AM', stars: 5,
    text: 'Absolutely love this place! The staff were so friendly and the service was impeccable. We came in for a last-minute appointment and were seen straight away. Will definitely be back soon.',
    aiDraft: "Dear Sarah, thank you so much for your wonderful words! We're truly delighted to hear you had such a great experience with our team. Welcoming you at short notice was our pleasure — that's exactly the kind of service we strive to provide every day. We look forward to seeing you again very soon!",
    expanded: true,
  },
  {
    id: 2,
    initials: 'MR', color: '#f59e0b',
    name: 'Mike R.', date: 'Yesterday', stars: 3,
    text: 'Decent experience overall. The quality of the work was good but we had to wait quite a long time despite having a booking. Would be great if the scheduling was a bit tighter.',
    aiDraft: '',
    expanded: false,
  },
  {
    id: 3,
    initials: 'JK', color: '#ef4444',
    name: 'James K.', date: '3 days ago', stars: 1,
    text: "Very disappointed with our visit. There were multiple issues and when we raised them, the response wasn't what we'd hoped for. Expected more given the reputation of the business.",
    aiDraft: '',
    expanded: false,
  },
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

const STAR_OPTS: (number | null)[] = [null, 5, 4, 3, 2, 1]
const SORT_OPTS: { label: string; value: SortOption }[] = [
  { label: 'Newest first',   value: 'newest'  },
  { label: 'Oldest first',   value: 'oldest'  },
  { label: 'Lowest rating',  value: 'lowest'  },
  { label: 'Highest rating', value: 'highest' },
]

export default function AwaitingReplyQueue() {
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [sort,       setSort]       = useState<SortOption>('newest')
  const [expanded,   setExpanded]   = useState<number | null>(1)
  const [resolved,   setResolved]   = useState<number[]>([])

  const visible = REVIEWS
    .filter(r => !resolved.includes(r.id))
    .filter(r => starFilter === null || r.stars === starFilter)
    .sort((a, b) => {
      if (sort === 'lowest')  return a.stars - b.stars
      if (sort === 'highest') return b.stars - a.stars
      if (sort === 'oldest')  return b.id - a.id
      return a.id - b.id
    })

  return (
    <div>
      {/* Filters bar */}
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

      {/* Queue */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-400">All caught up — no reviews awaiting a reply.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Card body */}
              <div className="flex items-start gap-5 px-6 py-5">

                {/* Left — avatar + meta */}
                <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.initials}
                  </div>
                  <Stars count={r.stars} />
                </div>

                {/* Center — customer info + review */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                    <span className="text-[11px] text-slate-400">via Google</span>
                    <span className="text-[11px] text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">{r.date}</span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-slate-600">{r.text}</p>
                </div>

                {/* Right — status + actions */}
                <div className="flex shrink-0 flex-col items-end gap-2.5">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                    Pending
                  </span>
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="cursor-pointer whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Generate reply
                  </button>
                  <button
                    onClick={() => setResolved(prev => [...prev, r.id])}
                    className="cursor-pointer text-[11px] text-slate-400 transition hover:text-slate-600"
                  >
                    Mark as resolved
                  </button>
                </div>
              </div>

              {/* AI Draft preview — expanded state */}
              {expanded === r.id && r.aiDraft && (
                <div className="mx-6 mb-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                  <div className="mb-2.5 flex items-center gap-1.5 text-blue-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-semibold">AI-generated reply</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-700">{r.aiDraft}</p>
                  <div className="mt-3.5 flex items-center gap-2">
                    <button className="cursor-pointer rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
                      Approve
                    </button>
                    <button className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300">
                      Edit
                    </button>
                    <button className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300">
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
