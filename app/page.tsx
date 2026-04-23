import ReplyForm from './ui/reply-form'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Reply<span className="text-blue-600">AI</span>
        </span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          ✦ Powered by Claude AI
        </span>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16 text-center">
        <h1 className="text-balance text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
          Turn Google Reviews into<br />
          <span className="text-blue-600">More Customers.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
          Reply to every review with smart responses that boost your rating
          and win more customers.
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {['⚡ Reply in seconds', '🎯 On-brand tone', '📈 Improve your rating'].map((feat) => (
            <span
              key={feat}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"
            >
              {feat}
            </span>
          ))}
        </div>

        {/* Card */}
        <div className="mt-14 rounded-3xl bg-white p-8 shadow-2xl shadow-blue-100/60 ring-1 ring-slate-100 sm:p-10">
          <ReplyForm />
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          ReplyAI · Your replies, always at their best
        </p>
      </main>
    </div>
  )
}
