'use client'

import { useState } from 'react'
import { Zap, Send, Mail } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

type AutoApprovalDelay = '2h' | '6h' | '12h' | '24h' | '48h'

type WorkflowSettingsState = {
  autoGenerateEnabled: boolean
  progressivePublishingEnabled: boolean
  autoApprovalDelay: AutoApprovalDelay
}

const STORAGE_KEY = 'replyfier.workflowSettings'

const DEFAULT_SETTINGS: WorkflowSettingsState = {
  autoGenerateEnabled: false,
  progressivePublishingEnabled: false,
  autoApprovalDelay: '24h',
}

const IS_PRO = false

const DELAY_OPTIONS: { value: AutoApprovalDelay; label: string }[] = [
  { value: '2h',  label: '2 hours'  },
  { value: '6h',  label: '6 hours'  },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' },
  { value: '48h', label: '48 hours' },
]

function loadSettings(): WorkflowSettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: WorkflowSettingsState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event('replyfier:workflowChanged'))
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
        checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function ProBadge() {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-px text-[9px] font-semibold text-amber-600">
      Pro
    </span>
  )
}

function WorkflowCard({
  icon,
  title,
  description,
  badge,
  locked,
  hint,
  checked,
  onChange,
  extra,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: React.ReactNode
  locked?: boolean
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  extra?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {badge}
            </div>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-slate-500">{description}</p>
            {hint && <p className="mt-1.5 text-[11px] italic text-slate-400">{hint}</p>}
            {extra && <div className="mt-3">{extra}</div>}
          </div>
        </div>
        <div className="mt-0.5 shrink-0">
          <Toggle checked={checked} disabled={locked} onChange={onChange} />
        </div>
      </div>
    </section>
  )
}

export default function WorkflowSettings() {
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved]       = useState(false)

  const convexSettings = useQuery(api.workflowSettings.get)
  const saveConvex     = useMutation(api.workflowSettings.save)

  const autoPublishEnabled   = convexSettings?.autoPublishEnabled   ?? false
  const emailApprovalEnabled = convexSettings?.emailApprovalEnabled ?? false

  function update(patch: Partial<WorkflowSettingsState>) {
    setSettings(current => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  async function updateConvex(patch: { autoPublishEnabled?: boolean; emailApprovalEnabled?: boolean }) {
    const next = {
      autoPublishEnabled:   patch.autoPublishEnabled   ?? autoPublishEnabled,
      emailApprovalEnabled: patch.emailApprovalEnabled ?? emailApprovalEnabled,
    }
    await saveConvex(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div className="max-w-2xl space-y-4">
      {saved && (
        <div className="flex items-center justify-end">
          <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            Saved
          </span>
        </div>
      )}

      <WorkflowCard
        icon={<Zap className="h-4 w-4 text-blue-600" strokeWidth={2} />}
        title="Auto-generate draft replies"
        description="Automatically generate AI draft replies for new reviews."
        checked={settings.autoGenerateEnabled}
        onChange={autoGenerateEnabled => update({ autoGenerateEnabled })}
      />

      <WorkflowCard
        icon={<Send className="h-4 w-4 text-blue-600" strokeWidth={2} />}
        title="Auto-publish replies"
        description="Publish drafts automatically using progressive pacing — max 5 per day, randomized intervals."
        checked={autoPublishEnabled}
        onChange={v => void updateConvex({ autoPublishEnabled: v })}
      />

      {!autoPublishEnabled && (
        <WorkflowCard
          icon={<Mail className="h-4 w-4 text-blue-600" strokeWidth={2} />}
          title="Email approval"
          description="Receive an email for each new draft reply — approve, reject, or open in dashboard to edit with one click."
          checked={emailApprovalEnabled}
          onChange={v => void updateConvex({ emailApprovalEnabled: v })}
        />
      )}
    </div>
  )
}
