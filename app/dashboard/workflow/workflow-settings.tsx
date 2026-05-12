'use client'

import { useState } from 'react'
import { Zap, Clock } from 'lucide-react'

type WorkflowSettingsState = {
  autoGenerateEnabled: boolean
  progressivePublishingEnabled: boolean
}

const STORAGE_KEY = 'replyfier.workflowSettings'

const DEFAULT_SETTINGS: WorkflowSettingsState = {
  autoGenerateEnabled: false,
  progressivePublishingEnabled: false,
}

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
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition ${
        checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function WorkflowCard({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>
        <div className="mt-0.5 shrink-0">
          <Toggle checked={checked} onChange={onChange} />
        </div>
      </div>
    </section>
  )
}

export default function WorkflowSettings() {
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(false)

  function update(patch: Partial<WorkflowSettingsState>) {
    setSettings(current => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
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
        description="Automatically generate draft replies for new reviews. Drafts are queued for your approval before publishing."
        checked={settings.autoGenerateEnabled}
        onChange={autoGenerateEnabled => update({ autoGenerateEnabled })}
      />

      <WorkflowCard
        icon={<Clock className="h-4 w-4 text-blue-600" strokeWidth={2} />}
        title="Progressive publishing"
        description="Publish approved replies gradually over time instead of all at once, for a more natural posting pattern."
        checked={settings.progressivePublishingEnabled}
        onChange={progressivePublishingEnabled => update({ progressivePublishingEnabled })}
      />
    </div>
  )
}
