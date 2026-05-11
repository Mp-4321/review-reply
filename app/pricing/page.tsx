'use client'

import { useState } from 'react'
import Navbar from '../ui/navbar'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For single-location businesses ready to reply smarter.',
    monthly: { price: '$29', billed: null },
    yearly:  { price: '$19', billed: 'Billed $228 annually' },
    bullets: [
      '1 location',
      'Unlimited replies',
      'All tones (professional, warm, direct)',
      '+$15/mo per extra location',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing businesses managing multiple locations.',
    monthly: { price: '$59', billed: null },
    yearly:  { price: '$39', billed: 'Billed $468 annually' },
    bullets: [
      'Up to 5 locations',
      'Unlimited replies',
      'Brand tone per location',
      'Priority support',
      '+$10/mo per extra location',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!,
    highlight: true,
  },
]

function Check({ bright }: { bright: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${bright ? 'text-blue-300' : 'text-blue-600'}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(priceId: string) {
    setLoading(priceId)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-slate-500">
          Start with 5 free replies. Upgrade when you&apos;re ready — no contracts, cancel anytime.
        </p>

        {/* Billing toggle — pill style */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                !yearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition ${
                yearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Yearly
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">
                Save 34%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-stretch">
          {PLANS.map((plan) => {
            const pricing = yearly ? plan.yearly : plan.monthly
            return (
              <div
                key={plan.id}
                className={`relative flex flex-1 flex-col rounded-2xl p-8 text-left ${
                  plan.highlight
                    ? 'bg-blue-900 shadow-2xl shadow-blue-200/50 ring-2 ring-blue-800'
                    : 'bg-white shadow-lg ring-1 ring-slate-200'
                }`}
              >
                {/* Most popular badge — top right, amber on dark */}
                {plan.highlight && (
                  <span className="absolute right-6 top-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                    Most popular
                  </span>
                )}

                {/* Plan name + tagline */}
                <h2 className={`text-2xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${plan.highlight ? 'text-blue-300' : 'text-slate-500'}`}>
                  {plan.tagline}
                </p>

                {/* Price */}
                <div className="mt-8">
                  <div className="flex items-end gap-1">
                    <span className={`text-6xl font-extrabold tracking-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {pricing.price}
                    </span>
                    <span className={`mb-2 text-base font-medium ${plan.highlight ? 'text-blue-300' : 'text-slate-400'}`}>
                      /mo
                    </span>
                  </div>
                  <p className={`mt-1 h-5 text-xs ${plan.highlight ? 'text-blue-400' : 'text-slate-400'}`}>
                    {pricing.billed ?? ''}
                  </p>
                </div>

                {/* CTA button */}
                <button
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading !== null}
                  className={`mt-7 w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                    plan.highlight
                      ? 'bg-white text-blue-900 hover:bg-blue-50 focus:ring-white'
                      : 'bg-blue-900 text-white hover:bg-blue-800 focus:ring-blue-900'
                  }`}
                >
                  {loading === plan.priceId ? 'Redirecting…' : 'Get Started'}
                </button>

                {/* Divider */}
                <div className={`my-7 h-px ${plan.highlight ? 'bg-blue-700' : 'bg-slate-100'}`} />

                {/* Features */}
                <p className={`mb-4 text-xs font-bold uppercase tracking-widest ${plan.highlight ? 'text-blue-400' : 'text-slate-400'}`}>
                  Included features
                </p>
                <ul className="space-y-3">
                  {plan.bullets.map((b) => (
                    <li key={b} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                      <Check bright={plan.highlight} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-base font-medium text-slate-600">
          Start with 5 free replies. No credit card required.
        </p>
      </main>
    </div>
  )
}
