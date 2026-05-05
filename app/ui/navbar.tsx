import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="relative z-[100] fixed inset-x-0 top-0 bg-white/95 backdrop-blur-sm">
      <div className="relative mx-auto flex h-14 max-w-5xl items-center px-6">
        <Link href="/" className="flex items-center gap-1.5 text-base font-bold tracking-tight text-slate-900">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Replyfier
        </Link>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-8">
          <Link href="/"          className="pointer-events-auto text-sm text-slate-500 transition hover:text-slate-900">Home</Link>
          <Link href="/#features" className="pointer-events-auto text-sm text-slate-500 transition hover:text-slate-900">Features</Link>
          <Link href="/pricing"   className="pointer-events-auto text-sm text-slate-500 transition hover:text-slate-900">Pricing</Link>
          <Link href="/#faq"      className="pointer-events-auto text-sm text-slate-500 transition hover:text-slate-900">FAQ</Link>
          <Link href="/#tool"     className="pointer-events-auto text-sm text-slate-500 transition hover:text-slate-900">Free Tool</Link>
        </div>
        <div className="relative z-10 ml-auto flex items-center gap-3">
          <a href="/sign-in" className="text-sm text-slate-600 transition hover:text-slate-900">Sign in</a>
          <a href="/sign-up" className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Sign up</a>
        </div>
      </div>
    </nav>
  )
}
