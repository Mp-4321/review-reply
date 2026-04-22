'use client'

import { useState } from 'react'

const TONES = [
  { value: 'professionale', label: 'Professionale' },
  { value: 'caloroso', label: 'Caloroso e amichevole' },
  { value: 'diretto', label: 'Diretto e conciso' },
]

export default function ReplyForm() {
  const [business, setBusiness] = useState('')
  const [review, setReview] = useState('')
  const [tone, setTone] = useState('professionale')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!review.trim() || !business.trim()) return
    setLoading(true)
    setReply('')
    setError('')
    setCopied(false)

    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business, review, tone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Errore nella generazione della risposta')
      } else {
        setReply(data.reply)
      }
    } catch {
      setError('Errore di rete. Controlla la connessione e riprova.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canGenerate = review.trim().length > 0 && business.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Business name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nome del tuo business
        </label>
        <input
          type="text"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          placeholder="es. Pizzeria Da Mario"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Review textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Recensione ricevuta
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Incolla qui la recensione Google che hai ricevuto..."
          rows={6}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
      </div>

      {/* Tone selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tono della risposta
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generazione in corso...
          </span>
        ) : (
          'Genera risposta'
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Reply output */}
      {reply && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Risposta generata</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copiato!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copia
                </>
              )}
            </button>
          </div>
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{reply}</p>
        </div>
      )}
    </div>
  )
}
