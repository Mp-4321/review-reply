import { Show } from '@clerk/nextjs'
import ReplyForm from './ui/reply-form'
import DemoCarousel from './ui/demo-carousel'
import Navbar from './ui/navbar'

const FEATURES = [
  {
    color: '#3b82f6',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
    title: 'Instant AI replies',
    description: 'Generate a professional, on-brand response in seconds using Claude AI — no editing required.',
  },
  {
    color: '#8b5cf6',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    ),
    title: 'Three reply tones',
    description: 'Choose professional, warm & friendly, or direct & concise — whatever fits your brand.',
  },
  {
    color: '#10b981',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: 'Any language',
    description: 'ReplyAI detects the language of the review and replies in kind — no configuration needed.',
  },
  {
    color: '#f59e0b',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    title: 'Business-aware replies',
    description: 'Include your business name naturally in every reply — never awkward, always on-brand.',
  },
  {
    color: '#6366f1',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    ),
    title: 'Refine in one click',
    description: 'Change tone, add your business name, and regenerate instantly — as many times as you need.',
  },
  {
    color: '#ec4899',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
    title: 'Improve your rating',
    description: 'Thoughtful, timely replies signal quality to Google and turn undecided visitors into customers.',
  },
]

const FAQS = [
  {
    q: 'How does ReplyAI work?',
    a: 'Paste a customer review, choose a tone (or leave it on Professional), and click Generate. ReplyAI sends the review to Claude AI, which writes a professional reply in seconds. You can then refine it with a different tone or add your business name.',
  },
  {
    q: 'Is it free to try?',
    a: 'Yes. You get 5 free replies before being asked to upgrade. No credit card required.',
  },
  {
    q: 'Which languages does it support?',
    a: 'Any language. ReplyAI detects the language of the review automatically and replies in the same language — no settings to configure.',
  },
  {
    q: 'How do I include my business name in the reply?',
    a: 'After your first reply is generated, a refinement panel appears. Type your business name there and click Regenerate — it will be included naturally in the new reply.',
  },
  {
    q: 'What happens when I reach the free limit?',
    a: 'A paywall appears with two subscription options. You can choose the Starter plan ($29/mo) for a single location or the Pro plan ($59/mo) for up to five locations.',
  },
  {
    q: 'Can I use ReplyAI for multiple locations?',
    a: 'Yes. The Pro plan supports up to 5 locations, each with its own custom brand tone. Additional locations can be added for $10/mo each.',
  },
  {
    q: 'Is my review data stored or used for AI training?',
    a: 'No. Review text is sent to the Claude API in real-time and is not stored on our servers or used for any training purposes.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes. You can cancel from your billing portal at any time. You will keep access until the end of the billing period — no cancellation fees.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      <Navbar />

      {/* Hero text */}
      <section className="mx-auto max-w-3xl px-6 pb-0 pt-28 text-center">
        <h1 className="text-balance text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
          Turn Google Reviews into<br />
          <span className="text-blue-600">More Customers.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
          Reply to every review with smart responses that boost your rating<br />
          and help you win more customers.
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
      </section>

      {/* Demo + tool card */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <DemoCarousel />

        <Show
          when="signed-out"
          fallback={
            <div id="tool" className="mt-10 rounded-3xl bg-white p-8 shadow-2xl shadow-blue-100/60 ring-1 ring-slate-100 sm:p-10">
              <ReplyForm />
            </div>
          }
        >
          <div className="mt-10 flex flex-col items-center gap-2">
            <a
              href="/sign-up"
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Generate your reply instantly
            </a>
            <p className="text-xs text-slate-400">Try for free · Cancel anytime</p>
          </div>
        </Show>
      </section>

      {/* Stats */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-blue-600">Why it matters</p>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Why replying to Google reviews matters
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { stat: '45%', label: 'of consumers', desc: 'are more likely to visit a business that replies to negative reviews', source: 'ReviewTrackers 2024' },
              { stat: '89%', label: 'of consumers', desc: 'prefer businesses that respond to all their reviews', source: 'BrightLocal 2026' },
              { stat: '20%', label: 'of ranking', desc: 'Review signals influence Google\'s local search ranking algorithm', source: 'Whitespark / BrightLocal' },
              { stat: '81%', label: 'of consumers', desc: 'now expect a reply within 7 days of leaving a review', source: 'BrightLocal 2026' },
            ].map((item) => (
              <div key={item.stat + item.label} className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
                <p className="text-4xl font-extrabold tracking-tight text-blue-600">{item.stat}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-700">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                <div className="mt-auto pt-4">
                  <div className="mb-2 w-16 border-t border-slate-300" />
                  <p className="text-xs text-slate-400">Source: {item.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-blue-600">Features</p>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to reply like a pro
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">
            Built specifically for businesses that care about their online reputation.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: f.color + '1a' }}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                    style={{ color: f.color }}
                  >
                    {f.icon}
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-2xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-blue-600">FAQ</p>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>

          <div className="mt-12 divide-y divide-slate-100">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 hover:text-blue-700">
                  {item.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="pb-10 text-center text-xs text-slate-400">
        ReplyAI · Your replies, always at their best
      </footer>
    </div>
  )
}
