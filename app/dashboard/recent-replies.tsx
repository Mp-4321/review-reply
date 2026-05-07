'use client'

import { useState } from 'react'

const STATUS_STYLES: Record<string, string> = {
  Replied:    'bg-green-50 text-green-700 border border-green-200',
  Pending:    'bg-amber-50 text-amber-700 border border-amber-200',
  'AI Draft': 'bg-violet-50 text-violet-700 border border-violet-200',
}

const ALL_ROWS = [
  { initials: 'SL', color: '#6366f1', name: 'Sarah L.',   source: 'via Google', stars: 5, status: 'Replied',   reply: "Thanks so much for your kind words! We're…", date: 'Today, 9:41 AM' },
  { initials: 'MR', color: '#f59e0b', name: 'Mike R.',    source: 'via Google', stars: 3, status: 'Pending',   reply: '—',                                          date: 'Yesterday' },
  { initials: 'ET', color: '#10b981', name: 'Emma T.',    source: 'via Google', stars: 5, status: 'AI Draft',  reply: "Thank you for your amazing review! We're…",  date: '2d ago' },
  { initials: 'JK', color: '#3b82f6', name: 'James K.',   source: 'via Google', stars: 4, status: 'Replied',   reply: "We're so glad you had a great experience!",  date: '3d ago' },
  { initials: 'OP', color: '#ec4899', name: 'Olivia P.',  source: 'via Google', stars: 5, status: 'Replied',   reply: "It means the world to us, thank you Olivia!", date: '4d ago' },
  { initials: 'DW', color: '#8b5cf6', name: 'Daniel W.',  source: 'via Google', stars: 2, status: 'Pending',   reply: '—',                                          date: '4d ago' },
  { initials: 'CH', color: '#14b8a6', name: 'Claire H.',  source: 'via Google', stars: 5, status: 'AI Draft',  reply: "Thank you so much Claire, we loved having…", date: '5d ago' },
  { initials: 'RS', color: '#f97316', name: 'Ryan S.',    source: 'via Google', stars: 4, status: 'Replied',   reply: "Great to hear, Ryan! Hope to see you again.", date: '6d ago' },
  { initials: 'LB', color: '#6366f1', name: 'Laura B.',   source: 'via Google', stars: 5, status: 'Replied',   reply: "Your kind words make our day, thank you!",   date: '7d ago' },
  { initials: 'TN', color: '#64748b', name: 'Tom N.',     source: 'via Google', stars: 3, status: 'Pending',   reply: '—',                                          date: '8d ago' },
  { initials: 'AJ', color: '#22c55e', name: 'Anna J.',    source: 'via Google', stars: 5, status: 'Replied',   reply: "We're thrilled you loved the experience!",   date: '9d ago' },
  { initials: 'BF', color: '#ef4444', name: 'Ben F.',     source: 'via Google', stars: 1, status: 'AI Draft',  reply: "We're sorry to hear this, Ben. Please…",     date: '10d ago' },
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

export default function RecentReplies() {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? ALL_ROWS : ALL_ROWS.slice(0, 5)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">Recent replies</h2>
        <button
          onClick={() => setExpanded(e => !e)}
          className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Show less' : 'View all'}
        </button>
      </div>

      {/* Google Business slim banner */}
      <div className="mx-4 mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-xs text-slate-500">Connect Google Business to sync reviews automatically</p>
        <span className="ml-3 shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600">Coming soon</span>
      </div>

      {/* Table header */}
      <div className="mt-3 grid grid-cols-[1.5fr_1fr_1fr_2fr_1fr] border-b border-slate-100 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <span>Customer</span>
        <span>Rating</span>
        <span>Status</span>
        <span>Reply</span>
        <span>Date</span>
      </div>

      {rows.map((row) => (
        <div
          key={row.name + row.date}
          className="grid grid-cols-[1.5fr_1fr_1fr_2fr_1fr] items-center border-b border-slate-50 px-6 py-3.5 last:border-0 hover:bg-slate-50/60"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: row.color }}
            >
              {row.initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{row.name}</p>
              <p className="text-[11px] text-slate-400">{row.source}</p>
            </div>
          </div>
          <Stars count={row.stars} />
          <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[row.status]}`}>
            {row.status}
          </span>
          <p className="truncate pr-4 text-[13px] text-slate-500">{row.reply}</p>
          <p className="text-[12px] text-slate-400">{row.date}</p>
        </div>
      ))}

      <div className="px-6 py-3 text-center text-xs text-slate-400">
        Showing {rows.length} of {ALL_ROWS.length}
      </div>
    </div>
  )
}
