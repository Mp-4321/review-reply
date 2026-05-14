'use client'

import { useState } from 'react'
import { Bell, CheckCheck, BarChart3 } from 'lucide-react'

type LowRatingThreshold = 1 | 2 | 3
type DraftReminderFrequency = 'daily' | 'every_2_days' | 'weekly'
type WeeklySummaryDay = 'monday' | 'friday'

type NotificationSettingsState = {
  newReviewEnabled: boolean
  lowRatingEnabled: boolean
  lowRatingThreshold: LowRatingThreshold
  draftReminderEnabled: boolean
  draftReminderFrequency: DraftReminderFrequency
  queueCompletedEnabled: boolean
  publishingFailedEnabled: boolean
  weeklySummaryEnabled: boolean
  weeklySummaryDay: WeeklySummaryDay
}

const STORAGE_KEY = 'replyfier.notificationSettings'

const DEFAULT_SETTINGS: NotificationSettingsState = {
  newReviewEnabled: true,
  lowRatingEnabled: true,
  lowRatingThreshold: 2,
  draftReminderEnabled: true,
  draftReminderFrequency: 'daily',
  queueCompletedEnabled: true,
  publishingFailedEnabled: true,
  weeklySummaryEnabled: true,
  weeklySummaryDay: 'monday',
}

const LOW_RATING_OPTIONS: { value: LowRatingThreshold; label: string }[] = [
  { value: 1, label: '1-star only' },
  { value: 2, label: '1-2 stars' },
  { value: 3, label: '1-3 stars' },
]

const DRAFT_REMINDER_OPTIONS: { value: DraftReminderFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every_2_days', label: 'Every 2 days' },
  { value: 'weekly', label: 'Weekly' },
]

const SUMMARY_DAY_OPTIONS: { value: WeeklySummaryDay; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'friday', label: 'Friday' },
]

function loadSettings(): NotificationSettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: NotificationSettingsState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
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
        checked
          ? 'border-blue-600 bg-blue-600'
          : 'border-slate-300 bg-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-xl">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {children}
      </div>
    </div>
  )
}

function SettingsCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function OptionGroup<T extends string | number>({
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string
  value: T
  options: { value: T; label: string }[]
  disabled?: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup">
      {options.map(option => (
        <label
          key={option.value}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            value === option.value
              ? 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-100'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <input
            type="radio"
            name={name}
            value={String(option.value)}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition ${
              value === option.value
                ? 'border-blue-600 bg-blue-600'
                : 'border-slate-300 bg-white'
            } peer-focus-visible:ring-2 peer-focus-visible:ring-blue-200`}
            aria-hidden="true"
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-white transition ${value === option.value ? 'opacity-100' : 'opacity-0'}`} />
          </span>
          {option.label}
        </label>
      ))}
    </div>
  )
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(false)

  function updateSettings(patch: Partial<NotificationSettingsState>) {
    setSettings(current => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div className="max-w-3xl space-y-5 pb-8">
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] font-medium text-slate-700">
              Operational notifications are currently delivered by email.
            </p>
          </div>
          {saved && (
            <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Saved
            </span>
          )}
        </div>
      </div>

      <SettingsCard title="Review alerts" icon={<Bell className="h-4 w-4 text-blue-600" strokeWidth={2} />}>
        <SettingRow
          title="Low-rating reviews"
          description="Get notified when a review needs urgent attention."
        >
          <Toggle
            checked={settings.lowRatingEnabled}
            onChange={lowRatingEnabled => updateSettings({ lowRatingEnabled })}
          />
          <OptionGroup
            name="low-rating-threshold"
            value={settings.lowRatingThreshold}
            options={LOW_RATING_OPTIONS}
            disabled={!settings.lowRatingEnabled}
            onChange={lowRatingThreshold => updateSettings({ lowRatingThreshold })}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Reply workflow" icon={<CheckCheck className="h-4 w-4 text-blue-600" strokeWidth={2} />}>
        <SettingRow
          title="Draft approval reminders"
          description="Get reminded when draft replies are waiting for approval."
        >
          <Toggle
            checked={settings.draftReminderEnabled}
            onChange={draftReminderEnabled => updateSettings({ draftReminderEnabled })}
          />
          <OptionGroup
            name="draft-reminder-frequency"
            value={settings.draftReminderFrequency}
            options={DRAFT_REMINDER_OPTIONS}
            disabled={!settings.draftReminderEnabled}
            onChange={draftReminderFrequency => updateSettings({ draftReminderFrequency })}
          />
        </SettingRow>

        <SettingRow
          title="Queue completed"
          description="Get notified when all queued replies have been published."
        >
          <Toggle
            checked={settings.queueCompletedEnabled}
            onChange={queueCompletedEnabled => updateSettings({ queueCompletedEnabled })}
          />
        </SettingRow>

        <SettingRow
          title="Publishing failed"
          description="Get notified if a scheduled reply fails to publish."
        >
          <Toggle
            checked={settings.publishingFailedEnabled}
            onChange={publishingFailedEnabled => updateSettings({ publishingFailedEnabled })}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Weekly summary" icon={<BarChart3 className="h-4 w-4 text-blue-600" strokeWidth={2} />}>
        <SettingRow
          title="Weekly performance summary"
          description="Get a weekly summary of reviews, reply rate, pending replies, and average response time."
        >
          <Toggle
            checked={settings.weeklySummaryEnabled}
            onChange={weeklySummaryEnabled => updateSettings({ weeklySummaryEnabled })}
          />
          <OptionGroup
            name="weekly-summary-day"
            value={settings.weeklySummaryDay}
            options={SUMMARY_DAY_OPTIONS}
            disabled={!settings.weeklySummaryEnabled}
            onChange={weeklySummaryDay => updateSettings({ weeklySummaryDay })}
          />
        </SettingRow>
      </SettingsCard>
    </div>
  )
}
