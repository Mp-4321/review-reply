'use client'

import { useState, useMemo, Fragment, useEffect } from 'react'

// ── Types & data ───────────────────────────────────────────────────────────

type Example = { stars: 1 | 3 | 5; label: string; text: string }

const GENERIC_FIVE: Example[] = [
  { stars: 5, label: 'Amazing service!', text: 'Absolutely incredible experience from start to finish! The team was so attentive and welcoming, the quality was outstanding, and every detail felt carefully considered. We left feeling genuinely impressed. Will definitely be back and recommending to everyone. Five stars without hesitation!' },
  { stars: 5, label: 'Best experience ever', text: 'One of the best experiences I have had in years. Everything was immaculate, the staff anticipated our needs before we even asked, and the whole process was seamless. I rarely leave reviews but this genuinely deserves recognition. Will be recommending to friends and family.' },
  { stars: 5, label: 'Highly recommend', text: 'From the moment I arrived I felt genuinely taken care of. The team was professional, warm, and incredibly knowledgeable. The quality exceeded what I expected at this price point. Every small detail was handled with care. This is the standard I will now measure everything else against.' },
  { stars: 5, label: 'Will come back!', text: 'I came in with high expectations and they were surpassed. The facility was spotless, the staff were genuinely friendly and helpful, and the results spoke for themselves. Booking was easy, communication was prompt, and the whole visit felt effortless. Already planning my next appointment.' },
]

const GENERIC_THREE: Example[] = [
  { stars: 3, label: 'Service was slow', text: 'The overall experience was decent — the quality of the work was acceptable, but we had to wait much longer than expected and communication could have been better. Not bad, but there is definitely room for improvement. Might give it another chance.' },
  { stars: 3, label: 'Mixed experience', text: 'Some aspects were genuinely good — the product itself was fine and the location is convenient. But the staff seemed distracted and our questions were answered vaguely. I did not leave feeling impressed. For the price I expected a bit more attention to detail.' },
  { stars: 3, label: 'Just average', text: 'Nothing wrong exactly, but nothing memorable either. The service was adequate, the wait was longer than stated, and the follow-up left something to be desired. A solid option if you have no alternatives, but I am not sure I would actively choose it again.' },
  { stars: 3, label: 'Room for improvement', text: 'The quality of the core service was acceptable, but the experience around it let things down. Booking was unnecessarily complicated, the space felt a bit neglected, and I had to ask twice for basic things. There is real potential here, but it needs work to match the pricing.' },
]

const GENERIC_ONE: Example[] = [
  { stars: 1, label: 'Staff was rude', text: 'Very unpleasant experience. The staff was dismissive and unprofessional from the moment we arrived. Our concerns were ignored and we were made to feel unwelcome. I expected a basic level of courtesy and did not receive it. Would not recommend.' },
  { stars: 1, label: 'Very disappointed', text: 'I had high hopes based on the reviews but the reality was completely different. The service was slow, the quality was poor, and when I raised my concerns I was met with indifference. I paid a premium price for a below-average experience. I will not be returning.' },
  { stars: 1, label: 'Avoid this place', text: 'Appalling from start to finish. The facility was not as advertised, promises made at booking were not honoured, and getting a response from the team was nearly impossible. I raised a complaint and it was ignored. This level of service is simply not acceptable.' },
  { stars: 1, label: 'Terrible service', text: 'Completely unprofessional. My appointment was rescheduled twice with no explanation, the work was done carelessly, and when I raised concerns I was dismissed. They charged full price for a job that was half done. I would strongly advise anyone to look elsewhere.' },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm & friendly' },
  { value: 'direct', label: 'Direct & concise' },
]

function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

function StarRow({ count }: { count: number }) {
  return (
    <span className="flex shrink-0 items-center gap-px">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="h-3 w-3" viewBox="0 0 24 24" fill="#D97706">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

// ── Constants ──────────────────────────────────────────────────────────────

const FREE_LIMIT = 3
const USAGE_KEY = 'replyai_usage_count'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/mo',
    bullets: ['1 location', '100 replies', 'All tones'],
    priceId: 'price_1TPet7RsAeMyWnyUt4yhcicH',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$59',
    period: '/mo',
    bullets: ['Up to 5 locations', 'Unlimited replies', 'Brand tone per location', 'Priority support'],
    priceId: 'price_1TPeu0RsAeMyWnyU3KOK1Tbm',
    highlight: true,
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function ReplyForm() {
  const [review, setReview] = useState('')
  const [tone, setTone] = useState('professional')
  const [business, setBusiness] = useState('')
  const [reply, setReply] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [usageCount, setUsageCount] = useState(0)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [loadingRegen, setLoadingRegen] = useState(false)

  const loading = loadingInitial || loadingRegen
  const canGenerate = review.trim().length > 0
  const isOverLimit = usageCount >= FREE_LIMIT
  const repliesLeft = Math.max(0, FREE_LIMIT - usageCount)

  useEffect(() => {
    const stored = localStorage.getItem(USAGE_KEY)
    if (stored) setUsageCount(parseInt(stored, 10))
  }, [])

  // Fixed random selection at mount — generic examples only
  const examples = useMemo(
    () => [pickRandom(GENERIC_FIVE), pickRandom(GENERIC_THREE), pickRandom(GENERIC_ONE)],
    []
  )

  async function callApi(params: { tone: string; business: string }) {
    setError('')
    setCopied(false)
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review,
          tone: params.tone,
          business: params.business,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate a reply')
      } else {
        setReply(data.reply)
        fetchKeywords(review)
        const next = usageCount + 1
        setUsageCount(next)
        localStorage.setItem(USAGE_KEY, String(next))
      }
    } catch {
      setError('Network error — check your connection and try again.')
    }
  }

  async function fetchKeywords(reviewText: string) {
    setKeywords([])
    try {
      const res = await fetch('/api/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: reviewText }),
      })
      if (res.ok) {
        const data = await res.json()
        setKeywords(Array.isArray(data.keywords) ? data.keywords : [])
      }
    } catch {
      // silently fail — highlights are a visual enhancement only
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return
    if (isOverLimit) { setPaywallOpen(true); return }
    setReply('')
    setKeywords([])
    setBusiness('')
    setLoadingInitial(true)
    await callApi({ tone, business: '' })
    setLoadingInitial(false)
  }

  async function handleUpgrade(priceId: string) {
    setCheckoutLoading(priceId)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      // silently fail — user stays on page
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handleRegenerate() {
    if (isOverLimit) { setPaywallOpen(true); return }
    setKeywords([])
    setLoadingRegen(true)
    await callApi({ tone, business })
    setLoadingRegen(false)
  }

  function renderReply(text: string) {
    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const kwPattern = escaped.length
      ? new RegExp(`(${escaped.join('|')})`, 'gi')
      : null

    return text.split(/\*\*(.+?)\*\*/g).map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold">{part}</strong>
      }
      if (!kwPattern) return <Fragment key={i}>{part}</Fragment>
      return (
        <Fragment key={i}>
          {part.split(kwPattern).map((seg, j) =>
            j % 2 === 1
              ? <span key={j} className="rounded bg-yellow-100 px-0.5 text-yellow-800">{seg}</span>
              : seg
          )}
        </Fragment>
      )
    })
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 text-left">
      {/* Example pills */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="shrink-0 text-xs font-medium text-slate-700">Try an example:</span>
        {examples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setReview(ex.text)}
            className="flex min-w-0 shrink items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <StarRow count={ex.stars} />
            <span className="truncate">{ex.label}</span>
          </button>
        ))}
      </div>

      {/* Review textarea */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Customer review
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Paste an existing review or type one..."
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="w-full rounded-xl bg-blue-900 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loadingInitial ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate reply instantly →'
        )}
      </button>

      {/* Usage counter */}
      {usageCount > 0 && !isOverLimit && (
        <p className={`-mt-2 text-center text-xs ${repliesLeft <= 1 ? 'text-red-500' : 'text-slate-400'}`}>
          {repliesLeft} free {repliesLeft === 1 ? 'reply' : 'replies'} remaining
        </p>
      )}
      {isOverLimit && (
        <p className="-mt-2 text-center text-xs text-red-500">
          Free limit reached —{' '}
          <button onClick={() => setPaywallOpen(true)} className="underline hover:text-red-700">
            upgrade to continue
          </button>
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">Something went wrong</p>
          <p className="mt-0.5 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Reply output */}
      {reply && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Your reply</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{renderReply(reply)}</p>
        </div>
      )}

      {/* Refinement panel */}
      {reply && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Refine (optional)
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <input
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Business name..."
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

          {/* Regenerate */}
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="mt-3 w-full rounded-lg border border-blue-900 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-1 disabled:opacity-40"
          >
            {loadingRegen ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Regenerating...
              </span>
            ) : (
              'Regenerate reply →'
            )}
          </button>
        </div>
      )}

      {/* Paywall modal */}
      {paywallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPaywallOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <button
              onClick={() => setPaywallOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              You've used your {FREE_LIMIT} free replies.<br />
              Start your <span className="font-extrabold">7-day free trial</span> to keep going.
            </h2>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleUpgrade(plan.priceId)}
                  disabled={checkoutLoading !== null}
                  className={`flex flex-1 flex-col items-start rounded-xl border-2 px-4 py-4 transition focus:outline-none disabled:opacity-60 ${
                    plan.highlight
                      ? 'border-blue-900 bg-blue-900 text-white hover:bg-blue-800'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-blue-900 hover:bg-slate-50'
                  }`}
                >
                  {checkoutLoading === plan.priceId ? (
                    <svg className="h-5 w-5 animate-spin self-center" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <>
                      <span className="text-sm font-bold">{plan.name} — {plan.price}/mo</span>
                      <ul className={`mt-2 space-y-1 text-xs leading-snug ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                        {plan.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-1.5">
                            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </button>
              ))}
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">No charge for 7 days. Cancel anytime.</p>

            <button
              onClick={() => setPaywallOpen(false)}
              className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
