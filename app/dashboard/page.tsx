import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RecentReplies from './recent-replies'
import { DashboardSync } from './sync'
import { DashboardStats } from './dashboard-stats'

const NAV_GROUPS = [
  {
    group: 'Reviews',
    items: [
      { label: 'All reviews',        href: '/dashboard/reviews',   soon: false },
      { label: 'Inbox',    href: '/dashboard/awaiting-reply', soon: false },
      { label: 'Queue',     href: '/dashboard/draft-replies', soon: false },
    ],
  },
  {
    group: 'Automation',
    items: [
      { label: 'AI Settings', href: '/dashboard/ai-settings', soon: false },
      { label: 'Workflow',    href: '/dashboard/workflow',    soon: false },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { label: 'Reply rate', href: '/dashboard/analytics', soon: false },
    ],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Notifications', href: '/dashboard/notifications', soon: false },
      { label: 'Billing',       href: '/dashboard/billing',       soon: false },
      { label: 'Locations',     href: '/dashboard/locations',     soon: true  },
      { label: 'Account',       href: '/dashboard/settings',      soon: false },
    ],
  },
]

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
        <Link href="/dashboard" className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-slate-900">Replyfier</span>
        </Link>

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

        <DashboardStats />

        <DashboardSync />
        <RecentReplies />

      </main>
    </div>
  )
}
