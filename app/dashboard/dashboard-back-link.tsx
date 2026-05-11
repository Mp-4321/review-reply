import Link from 'next/link'

export default function DashboardBackLink() {
  return (
    <Link
      href="/dashboard"
      aria-label="Back to dashboard"
      className="mr-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back</span>
    </Link>
  )
}
