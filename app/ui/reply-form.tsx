'use client'

import { useState } from 'react'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm & friendly' },
  { value: 'direct', label: 'Direct & concise' },
]

const EXAMPLES = [
  {
    label: '⭐⭐⭐⭐⭐ Amazing service!',
    text: 'Absolutely incredible experience from start to finish! The team was so attentive and welcoming, the quality was outstanding, and every detail felt carefully considered. We left feeling genuinely impressed. Will definitely be back and recommending to everyone. Five stars without hesitation!',
  },
  {
    label: '⭐⭐ Food was cold...',
    text: "Really disappointed with our visit. We waited over 40 minutes for our order, and when it arrived the food was cold and not what we expected at this price point. Staff seemed overwhelmed and didn't check on us once. Expected much better based on the reviews.",
  },
]

export default function ReplyForm() {
  const [review, setReview] = useState('')
  const [tone, setTone] = useState('')
  const [business, setBusiness] = useState('')
  const [reply, setReply] = useState('')
  const [lastParams, setLastParams] = useState({ tone: '', business: '' })
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [loadingRegen, setLoadingRegen] = useState(false)

  const loading = loadingInitial || loadingRegen
  const canGenerate = review.trim().length > 0
  const showRegenerate =
    reply.length > 0 && (tone !== lastParams.tone || business !== lastParams.business)

  async function callApi(params: { tone: string; business: string }) {
    setError('')
    setCopied(false)
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review, tone: params.tone, business: params.business }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate a reply')
      } else {
        setReply(data.reply)
        setLastParams(params)
      }
    } catch {
      setError('Network error — check your connection and try again.')
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return
    setReply('')
    setTone('')
    setBusiness('')
    setLastParams({ tone: '', business: '' })
    setLoadingInitial(true)
    await callApi({ tone: '', business: '' })
    setLoadingInitial(false)
  }

  async function handleRegenerate() {
    setLoadingRegen(true)
    await callApi({ tone, business })
    setLoadingRegen(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 text-left">
      {/* Example pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setReview(ex.text)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            {ex.label}
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
          placeholder="Paste the Google review here..."
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
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{reply}</p>
        </div>
      )}

      {/* Refinement panel — shown after first generation */}
      {reply && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Refine (optional)
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Tone selector */}
            <div className="relative flex-1">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Refine tone...</option>
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

            {/* Business name */}
            <input
              type="text"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="Add business name..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Regenerate — only when params changed */}
          {showRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-1 disabled:opacity-40"
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
                'Regenerate →'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
