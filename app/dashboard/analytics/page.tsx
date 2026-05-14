import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReplyRateAnalytics from './reply-rate-analytics'
import DashboardBackLink from '../dashboard-back-link'

const NAV_GROUPS = [
  {
    group: 'Reviews',
    items: [
      { label: 'All reviews',    href: '/dashboard/reviews',        soon: false },
      { label: 'Inbox', href: '/dashboard/inbox', soon: false },
      { label: 'Queue',  href: '/dashboard/queue', soon: false },
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

export default async function ReplyRatePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user     = await currentUser()
  const email    = user?.emailAddresses[0]?.emailAddress ?? ''
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(s => s![0]).join('').toUpperCase() || '?'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-52 flex-col border-r border-slate-200 bg-white">
        <Link href="/dashboard" className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-slate-900">Replyfier</span>
        </Link>

        <div className="mx-3 mt-3 mb-8 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">The Style Co.</p>
            <p className="truncate text-[11px] text-slate-400">Main Street · Boston</p>
          </div>
          <svg className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-7">
              <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">{group}</p>
              {items.map(({ label, href, soon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center justify-between rounded-md px-2 py-1 text-[13px] transition hover:bg-slate-100 hover:text-slate-900 ${
                    href === '/dashboard/analytics'
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-slate-600'
                  }`}
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

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-7 flex max-w-[1300px] items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reply rate</h1>
            <p className="mt-1 text-sm text-slate-400">
              Track how consistently your business responds to reviews.
            </p>
          </div>
          <DashboardBackLink />
        </div>

        <ReplyRateAnalytics />
      </main>
    </div>
  )
}
