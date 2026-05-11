'use client'

import { useState } from 'react'

type LowRatingThreshold = 1 | 2 | 3
type DraftReminderFrequency = 'daily' | 'every_2_days' | 'weekly'
type WeeklySummaryDay = 'monday' | 'friday'

type NotificationSettingsState = {
  newReviewEmail: boolean
  newReviewInApp: boolean
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
  newReviewEmail: true,
  newReviewInApp: false,
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
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function SelectControl<T extends string | number>({
  value,
  options,
  disabled,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  disabled?: boolean
  onChange: (value: T) => void
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={event => {
        const selected = options.find(option => String(option.value) === event.target.value)
        if (selected) onChange(selected.value)
      }}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Operational alerts</p>
            <p className="mt-0.5 text-[13px] text-slate-600">
              These settings are saved locally for now and are structured for account-level persistence later.
            </p>
          </div>
          {saved && (
            <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Saved
            </span>
          )}
        </div>
      </div>

      <SettingsCard title="Review alerts">
        <SettingRow
          title="New reviews"
          description="Get notified when new Google reviews arrive."
        >
          <span className="text-xs font-medium text-slate-500">Email</span>
          <Toggle
            checked={settings.newReviewEmail}
            onChange={newReviewEmail => updateSettings({ newReviewEmail })}
          />
          <span className="ml-2 text-xs font-medium text-slate-400">In-app</span>
          <Toggle
            checked={settings.newReviewInApp}
            disabled
            onChange={newReviewInApp => updateSettings({ newReviewInApp })}
          />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            Soon
          </span>
        </SettingRow>

        <SettingRow
          title="Low-rating reviews"
          description="Get notified immediately when a review needs urgent attention."
        >
          <Toggle
            checked={settings.lowRatingEnabled}
            onChange={lowRatingEnabled => updateSettings({ lowRatingEnabled })}
          />
          <SelectControl
            value={settings.lowRatingThreshold}
            options={LOW_RATING_OPTIONS}
            disabled={!settings.lowRatingEnabled}
            onChange={lowRatingThreshold => updateSettings({ lowRatingThreshold })}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Reply workflow">
        <SettingRow
          title="Draft approval reminders"
          description="Remind me when draft replies are waiting for approval."
        >
          <Toggle
            checked={settings.draftReminderEnabled}
            onChange={draftReminderEnabled => updateSettings({ draftReminderEnabled })}
          />
          <SelectControl
            value={settings.draftReminderFrequency}
            options={DRAFT_REMINDER_OPTIONS}
            disabled={!settings.draftReminderEnabled}
            onChange={draftReminderFrequency => updateSettings({ draftReminderFrequency })}
          />
        </SettingRow>

        <SettingRow
          title="Queue completed"
          description="Notify me when all queued replies have been published."
        >
          <Toggle
            checked={settings.queueCompletedEnabled}
            onChange={queueCompletedEnabled => updateSettings({ queueCompletedEnabled })}
          />
        </SettingRow>

        <SettingRow
          title="Publishing failed"
          description="Notify me if a scheduled reply fails to publish."
        >
          <Toggle
            checked={settings.publishingFailedEnabled}
            onChange={publishingFailedEnabled => updateSettings({ publishingFailedEnabled })}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Weekly summary">
        <SettingRow
          title="Weekly performance summary"
          description="Receive a weekly overview of reviews received, reply rate, pending reviews, and average response time."
        >
          <Toggle
            checked={settings.weeklySummaryEnabled}
            onChange={weeklySummaryEnabled => updateSettings({ weeklySummaryEnabled })}
          />
          <SelectControl
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
