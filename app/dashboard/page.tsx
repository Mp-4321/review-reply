import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV_GROUPS = [
  {
    group: 'Reviews',
    items: [
      { label: 'Reviews & Replies', href: '/dashboard/reviews',   soon: false },
      { label: 'Pending replies',   href: '/dashboard/pending',   soon: false },
      { label: 'Generated replies', href: '/dashboard/generated', soon: false },
    ],
  },
  {
    group: 'Automation',
    items: [
      { label: 'AI Reply Settings', href: '/dashboard/ai-settings',  soon: true },
      { label: 'Notifications',     href: '/dashboard/notifications', soon: true },
    ],
  },
  {
    group: 'Insights',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', soon: true },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Locations', href: '/dashboard/locations', soon: true  },
      { label: 'Billing',   href: '/dashboard/billing',   soon: false },
      { label: 'Settings',  href: '/dashboard/settings',  soon: false },
    ],
  },
]

const MOCK_ROWS = [
  {
    initials: 'SL', color: '#6366f1',
    name: 'Sarah L.', source: 'via Google',
    stars: 5, status: 'Replied',
    reply: "Thanks so much for your kind words! We're…",
    date: 'Today, 9:41 AM',
  },
  {
    initials: 'MR', color: '#f59e0b',
    name: 'Mike R.', source: 'via Google',
    stars: 3, status: 'Pending',
    reply: '—',
    date: 'Yesterday',
  },
  {
    initials: 'ET', color: '#10b981',
    name: 'Emma T.', source: 'via Google',
    stars: 5, status: 'AI Draft',
    reply: "Thank you for your amazing review! We're…",
    date: '2d ago',
  },
]

const STATUS_STYLES: Record<string, string> = {
  Replied:  'bg-green-50 text-green-700 border border-green-200',
  Pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  'AI Draft': 'bg-violet-50 text-violet-700 border border-violet-200',
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

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const firstName = user?.firstName ?? 'there'
  const email = user?.emailAddresses[0]?.emailAddress ?? ''
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(s => s![0]).join('').toUpperCase() || '?'

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <aside className="flex w-52 flex-col border-r border-slate-200 bg-white">

        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-slate-900">Replyfier</span>
        </div>

        {/* Location selector */}
        <div className="mx-3 mt-3 mb-8 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">The Style Co.</p>
            <p className="truncate text-[11px] text-slate-400">Main Street · Boston</p>
          </div>
          <svg className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-7">
              <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">{group}</p>
              {items.map(({ label, href, soon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-[13px] text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>{label}</span>
                  {soon && (
                    <span className="ml-1.5 rounded-full border border-slate-200 bg-white px-1 py-px text-[9px] font-medium text-slate-400">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="truncate text-[11px] text-slate-400">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-400">{formatDate()}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Trial · 7 days left
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {initials}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Replies generated */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Replies generated</p>
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
            <p className="mt-1 text-xs text-slate-400">All time</p>
          </div>

          {/* Reviews pending */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Reviews pending</p>
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">0</p>
            <p className="mt-1 text-xs text-slate-400">Awaiting your reply</p>
          </div>

          {/* Current rating */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Current rating</p>
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">4.8</p>
            <p className="mt-1 text-xs text-slate-400">Google Business</p>
          </div>

          {/* Total reviews */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total reviews</p>
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">128</p>
            <p className="mt-1 text-xs text-slate-400">All time</p>
          </div>
        </div>

        {/* Recent replies */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent replies</h2>
            <Link href="/dashboard/reviews" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
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

          {/* Mock rows */}
          {MOCK_ROWS.map((row) => (
            <div
              key={row.name}
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
            Showing 3 of 3
          </div>
        </div>

      </main>
    </div>
  )
}
