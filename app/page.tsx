import type { ReactNode } from 'react'
import Link from 'next/link'
import { Show } from '@clerk/nextjs'
import ReplyForm from './ui/reply-form'
import DemoCarousel from './ui/demo-carousel'
import Navbar from './ui/navbar'
import { AnimatedStepCard } from './ui/step-card'
import RotatingWord from './ui/rotating-word'
import { StepMock3, StepMock4 } from './ui/step-mocks'

const FEATURES = [
  {
    color: '#3b82f6',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
    title: 'Smart review replies',
    description: 'Generate professional AI-powered replies that sound human.',
  },
  {
    color: '#8b5cf6',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: 'Approval workflow',
    description: 'Review, edit, and approve replies before publishing.',
  },
  {
    color: '#10b981',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: 'Automatic language detection',
    description: 'Automatically reply in the same language as the review.',
  },
  {
    color: '#f59e0b',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    title: 'Brand-aware replies',
    description: 'Keep replies aligned with your brand voice and business style.',
  },
  {
    color: '#6366f1',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    ),
    title: 'Scheduled publishing',
    description: 'Queue replies and publish them gradually over time.',
  },
  {
    color: '#ec4899',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
    title: 'Reputation consistency',
    description: 'Maintain a more active and consistent presence across your reviews.',
  },
]

const FAQS = [
  {
    q: 'How does Replyfier work?',
    a: 'Replyfier helps businesses respond to Google reviews faster using AI-generated reply drafts. Reviews can be reviewed, edited, approved, and published gradually to maintain a natural and professional response workflow.',
  },
  {
    q: 'Can replies match my brand tone?',
    a: 'Yes. You can customize reply tone, response length, business context, and additional instructions so replies feel consistent with your brand.',
  },
  {
    q: 'Will AI-generated replies sound generic?',
    a: 'Replyfier is designed to generate natural, professional replies that match your preferred tone and business context. Every reply can also be edited before publishing.',
  },
  {
    q: 'Does Replyfier automatically post replies?',
    a: 'Replyfier gives you full control over how replies are published. You can review and publish replies manually, or approve multiple replies and let Replyfier publish them gradually over time.',
  },
  {
    q: 'Does Replyfier connect to Google Business Profile?',
    a: 'Yes. You can securely connect your Google Business Profile to manage reviews and reply workflows directly from Replyfier.',
  },
  {
    q: 'Which languages does it support?',
    a: 'Replyfier can support reviews in multiple languages and helps generate replies in the language customers use.',
  },
  {
    q: 'Can I use Replyfier for multiple locations?',
    a: 'Yes. Replyfier is built for businesses that manage one or more locations, with workflows that can scale across multiple Google Business Profiles.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'You get a 7-day free trial with full access to Replyfier. After the trial ends, you can choose a subscription plan based on the number of business locations you manage.',
  },
  {
    q: 'Is my review data used for AI training?',
    a: 'No. Review data is processed securely to generate replies and is not used to train AI models.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. You can cancel your subscription at any time. Your access will remain active until the end of your current monthly or annual billing period.',
  },
  {
    q: 'How can I contact support?',
    a: 'You can reach us anytime at support@replyfier.com.',
  },
]

// ——— Step mocks (static UI previews) ———

const StepMock1 = (
  <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 text-xs">
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-slate-800">My Business</p>
          <p className="text-[10px] text-slate-400">Google Business Profile</p>
        </div>
      </div>
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Connected</span>
    </div>
  </div>
)

const StepMock2 = (
  <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 text-xs">
    <div className="flex items-start gap-2.5 p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50">
        <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="font-medium text-slate-800">New review received</p>
        <p className="mt-0.5 text-[10px] text-amber-500">★☆☆☆☆ · just now</p>
      </div>
    </div>
  </div>
)

const StepMock5 = (
  <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 text-xs">
    <div className="p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-medium text-slate-800">Reply posted on Google</p>
      </div>
      <div className="mt-2 flex items-center gap-1 text-slate-400">
        <span className="text-[10px]" style={{ filter: 'drop-shadow(0 0 0.5px rgba(180,130,0,0.4))' }}>
          <span className="text-amber-400">★★★★</span><span className="relative inline-block leading-none"><span className="text-slate-200">★</span><span className="absolute inset-0 w-1/2 overflow-hidden text-amber-400">★</span></span>
        </span>
        <span className="ml-1 text-xs">4.5 · 112 reviews</span>
      </div>
    </div>
  </div>
)

// ——— Type + data ———

type StepDef = {
  n: number
  side: 'left' | 'right'
  icon: ReactNode
  title: string
  desc: ReactNode
  mock: ReactNode
}

const stepIcon = (path: string) => (
  <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
)

const HOW_IT_WORKS_STEPS: StepDef[] = [
  { n: 1, side: 'left',  icon: stepIcon('M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'),        title: 'Connect your Google Business', desc: 'Link once — reviews sync automatically.', mock: StepMock1 },
  { n: 2, side: 'right', icon: stepIcon('M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'), title: 'Never miss a review',      desc: 'Get notified by email when a new review arrives.',         mock: StepMock2 },
  { n: 3, side: 'left',  icon: stepIcon('M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'), title: 'Generate your reply',      desc: 'AI adapts the tone. Done in seconds.',             mock: <StepMock3 /> },
  { n: 4, side: 'right', icon: stepIcon('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'), title: 'Review before sending',    desc: 'Edit or approve in one click.',   mock: <StepMock4 /> },
  { n: 5, side: 'left',  icon: stepIcon('M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5'),                                                title: 'Post to Google instantly', desc: 'Publish your reply. No copy-paste.',        mock: StepMock5 },
]

// ——— Components ———

function StepNode({ step }: { step: StepDef }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-blue-500 ring-2 ring-blue-200">
      {step.n}
    </div>
  )
}

function StepCardContent({ step }: { step: StepDef }) {
  return (
    <>
      <div className="flex items-center gap-2">
        {step.icon}
        <p className="font-semibold text-sm text-slate-900">{step.title}</p>
      </div>
      <p className="mt-0.5 text-sm text-slate-500">{step.desc}</p>
      {step.mock}
    </>
  )
}

// Mobile: single-column, left-side timeline
function MobileStep({ step, isLast }: { step: StepDef; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <StepNode step={step} />
        {!isLast && <div className="mt-2 w-0.5 flex-1 bg-slate-200" />}
      </div>
      <div className={`flex-1 ${isLast ? '' : 'pb-7'}`}>
        <AnimatedStepCard outerClassName="rounded-xl" innerClassName="rounded-[10px] p-5">
          <StepCardContent step={step} />
        </AnimatedStepCard>
      </div>
    </div>
  )
}

// Desktop: renders 3 grid cells per step
function DesktopCells({ step }: { step: StepDef }) {
  const card = (
    <AnimatedStepCard outerClassName="rounded-2xl" innerClassName="rounded-[14px] p-5">
      <StepCardContent step={step} />
    </AnimatedStepCard>
  )
  const node = (
    <div className="relative z-10 flex items-center justify-center pb-7">
      <StepNode step={step} />
    </div>
  )

  if (step.side === 'left') return (
    <>
      <div className="pb-7 pr-6">{card}</div>
      {node}
      <div className="pb-7" />
    </>
  )

  return (
    <>
      <div className="pb-7" />
      {node}
      <div className="pb-7 pl-6">{card}</div>
    </>
  )
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#eaf4ff,#f4f9ff_25%,#fafcff_55%,white)]">
      <div className="absolute -left-[200px] -top-[240px] z-0 h-[560px] w-[560px] pointer-events-none blur-2xl bg-[radial-gradient(circle,rgba(96,165,250,0.06),transparent_80%)]" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_95%_35%,rgba(219,234,254,0.12),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 z-0 h-[600px] pointer-events-none bg-[linear-gradient(180deg,rgba(219,234,254,0.25)_0%,rgba(255,255,255,0)_60%)]" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.82),transparent_65%)]" />

      <div className="pointer-events-none absolute right-[-80px] top-[120px] z-0 hidden h-[500px] w-[460px] overflow-hidden opacity-50 lg:block">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 460 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M500 40C370 82 290 158 252 268C214 378 130 454 -20 494" stroke="#60A5FA" strokeOpacity="0.12" strokeWidth="1" />
          <path d="M488 120C372 152 304 218 268 312C232 406 152 464 16 498" stroke="#93C5FD" strokeOpacity="0.11" strokeWidth="1" />
          <path d="M470 205C382 228 326 278 294 348C262 418 196 466 74 496" stroke="#BFDBFE" strokeOpacity="0.14" strokeWidth="1" />
          <defs>
            <pattern id="hero-dot-grid" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#60A5FA" fillOpacity="0.18" />
            </pattern>
            <linearGradient id="dot-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="60%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id="dot-mask">
              <rect x="0" y="0" width="460" height="500" fill="url(#dot-fade)" />
            </mask>
          </defs>
          <rect x="220" y="100" width="230" height="300" fill="url(#hero-dot-grid)" mask="url(#dot-mask)" opacity="0.22" />
        </svg>
      </div>

      <div className="relative z-10">
      <Navbar />

      {/* Hero text */}
      <section className="mx-auto max-w-3xl px-6 pb-0 pt-[72px]">
        <h1 className="mx-[17px] text-[54px] font-extrabold leading-[1.1] tracking-tight text-center text-slate-900">
          <span className="block mb-1">Turn Google Reviews into</span>
          {' '}<span className="text-blue-600">More </span><RotatingWord />
        </h1>

        <p className="mt-5 mx-auto text-center text-lg leading-relaxed text-slate-500">
          AI replies that sound human, building trust with every review.
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {['⚡ Reply in seconds', '🎯 On-brand tone', '📈 Boost your rating'].map((feat) => (
            <span
              key={feat}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm whitespace-nowrap"
            >
              {feat}
            </span>
          ))}
        </div>
      </section>

      {/* Demo + tool card */}
      <section className="mx-auto max-w-3xl px-9 pb-20">
        <DemoCarousel />

        <Show
          when="signed-out"
          fallback={
            <div id="tool" className="mt-10 rounded-3xl bg-white p-8 shadow-2xl shadow-blue-100/60 ring-1 ring-slate-100 sm:p-10">
              <ReplyForm />
            </div>
          }
        >
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href="/sign-up"
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Generate your first reply →
            </Link>
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
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { stat: '89%', label: 'of consumers', desc: <>expect business owners to<br />always respond to reviews.</>, source: 'BrightLocal 2026' },
              { stat: '45%', label: 'of customers', desc: 'are more likely to visit a business that replies to negative reviews.', source: 'ReviewTrackers 2024' },
              { stat: '81%', label: 'of consumers', desc: 'now expect a reply within 7 days of leaving a review.', source: 'BrightLocal 2026' },
            ].map((item) => (
              <div key={item.stat + item.label} className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                <p className="text-4xl font-extrabold tracking-tight text-blue-600">{item.stat}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 text-left">{item.label} {item.desc}</p>
                <div className="mt-auto pt-4">
                  <div className="mb-2 mx-auto w-8 border-t border-slate-300" />
                  <p className="text-xs text-slate-400">Source: {item.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <style dangerouslySetInnerHTML={{ __html: '@keyframes card-border-spin { to { transform: rotate(360deg); } }' }} />
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-blue-600">How it works</p>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Set up once. Reply in seconds.
          </h2>

          {/* Mobile: vertical left-aligned timeline */}
          <div className="mt-14 lg:hidden">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <MobileStep key={step.n} step={step} isLast={i === HOW_IT_WORKS_STEPS.length - 1} />
            ))}
          </div>

          {/* Desktop: zig-zag with central line */}
          <div className="mt-14 hidden lg:block">
            <div className="relative mx-auto grid max-w-3xl grid-cols-[1fr_4rem_1fr]">
              <div className="pointer-events-none absolute top-[10px] bottom-[30px] left-1/2 z-0 w-[4px] -translate-x-1/2 bg-gradient-to-b from-transparent via-blue-300 to-transparent" />
              {HOW_IT_WORKS_STEPS.map((step) => (
                <DesktopCells key={step.n} step={step} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-blue-600">Features</p>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to manage Google reviews
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
        Replyfier · Your replies, always at their best
        {' · '}
        <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
        {' · '}
        <Link href="/terms" className="hover:text-slate-600">Terms</Link>
      </footer>
      </div>
    </div>
  )
}
