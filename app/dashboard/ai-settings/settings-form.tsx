'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

type Tone         = 'professional' | 'friendly' | 'warm' | 'casual' | 'concise'
type ReplyLength  = 'short' | 'balanced' | 'detailed'

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Polished and business-appropriate'  },
  { value: 'friendly',     label: 'Friendly',     description: 'Warm and approachable'              },
  { value: 'warm',         label: 'Warm',         description: 'Personal and caring'                },
  { value: 'casual',       label: 'Casual',       description: 'Relaxed and conversational'         },
  { value: 'concise',      label: 'Concise',      description: 'Direct and to the point'            },
]

const LENGTHS: { value: ReplyLength; label: string; description: string }[] = [
  { value: 'short',    label: 'Short',    description: '1–2 sentences'        },
  { value: 'balanced', label: 'Balanced', description: '2–4 sentences'        },
  { value: 'detailed', label: 'Detailed', description: 'Full paragraph reply'    },
]

export default function AISettingsForm() {
  const settings = useQuery(api.aiSettings.get)
  const saveSettings = useMutation(api.aiSettings.save)

  const [businessDescription, setBusinessDescription] = useState('')
  const [tone,                 setTone]                = useState<Tone>('friendly')
  const [replyLength,          setReplyLength]         = useState<ReplyLength>('balanced')
  const [signature,            setSignature]           = useState('')
  const [customInstructions,   setCustomInstructions]  = useState('')

  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Hydrate form when settings load
  useEffect(() => {
    if (!settings) return
    if (settings.businessDescription) setBusinessDescription(settings.businessDescription)
    if (settings.tone)                setTone(settings.tone as Tone)
    if (settings.replyLength)         setReplyLength(settings.replyLength)
    if (settings.signature != null)   setSignature(settings.signature)
    if (settings.customInstructions)  setCustomInstructions(settings.customInstructions)
  }, [settings])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveSettings({ businessDescription, tone, replyLength, signature, customInstructions })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (settings === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Business context */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Business context</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">Help Replyfier understand your business and customers.</p>
        </div>
        <textarea
          value={businessDescription}
          onChange={e => setBusinessDescription(e.target.value)}
          rows={4}
          placeholder="Independent coffee shop serving students, remote workers, and local customers."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13.5px] leading-relaxed text-slate-700 placeholder-slate-300 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Reply tone */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Reply tone</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">How should Replyfier sound when responding to customers?</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {TONES.map(t => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`flex flex-col items-start rounded-xl border px-3.5 py-3 text-left transition ${
                tone === t.value
                  ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-300'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span className={`text-[13px] font-semibold ${tone === t.value ? 'text-blue-700' : 'text-slate-700'}`}>
                {t.label}
              </span>
              <span className="mt-0.5 text-[11px] leading-snug text-slate-400">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reply length */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Reply length</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">Select how detailed replies should be.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LENGTHS.map(l => (
            <button
              key={l.value}
              onClick={() => setReplyLength(l.value)}
              className={`flex flex-col items-start rounded-xl border px-4 py-3.5 text-left transition ${
                replyLength === l.value
                  ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-300'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span className={`text-[13px] font-semibold ${replyLength === l.value ? 'text-blue-700' : 'text-slate-700'}`}>
                {l.label}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400">{l.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Signature */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Reply signature</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">Optional signature appended to generated replies.</p>
        </div>
        <input
          type="text"
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder="— Marco, Owner"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 placeholder-slate-300 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Custom instructions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Custom instructions</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Add specific instructions to personalize how Replyfier writes replies for your business.
          </p>
        </div>
        <textarea
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          rows={4}
          placeholder={'As an example:\nMention our team when customers praise the service.\nKeep replies friendly and professional.\nAvoid generic-sounding responses.'}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13.5px] leading-relaxed text-slate-700 placeholder-slate-300 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pb-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-green-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Settings saved
          </span>
        )}
      </div>

    </div>
  )
}
