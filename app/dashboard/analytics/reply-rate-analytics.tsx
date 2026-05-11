'use client'

import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

type Period = '7d' | '30d' | '90d' | 'all'

const PERIODS: { label: string; value: Period; days: number | null }[] = [
  { label: 'Last 7 days',  value: '7d',  days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'All time',     value: 'all', days: null },
]

type Review = NonNullable<ReturnType<typeof useQuery<typeof api.reviews.list>>>[number]

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return 'Under 1 minute'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? '~1 hour' : `~${hours} hours`

  const days = Math.round(hours / 24)
  if (days <= 1) return '1 day'
  return `${days} days`
}

function formatBucketLabel(date: Date, period: Period) {
  if (period === 'all') return date.toLocaleDateString('en-US', { month: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function formatComparison(comparison: number, period: Period) {
  if (period === 'all') return 'All-time reply coverage'
  if (comparison > 0) return `+${comparison}% vs previous period`
  if (comparison < 0) return 'Response rate lower than previous period'
  return 'In line with previous period'
}

function insightTitle(rate: number, remaining: number) {
  if (remaining === 0) return 'Reply coverage is complete'
  if (rate >= 80) return 'Reply coverage is strong'
  if (rate >= 50) return 'Reply coverage has room to improve'
  return 'Reply coverage is below average'
}

function insightCopy(replied: number, total: number, remaining: number) {
  if (total === 0) return 'No reviews were received in this period. New reviews will appear here as they sync.'
  if (remaining === 0) return `You replied to all ${total} reviews in this period. Keep this cadence as new reviews arrive.`
  return `You replied to ${replied} out of ${total} reviews in this period. ${remaining} reviews still need attention.`
}

function getWindowStart(period: Period, now: Date, reviews: Review[]) {
  const config = PERIODS.find(p => p.value === period)
  if (config?.days) return addDays(startOfDay(now), -config.days + 1)
  if (reviews.length === 0) return addDays(startOfDay(now), -29)

  const first = reviews
    .map(r => new Date(r.createTime).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0]

  return first ? startOfDay(new Date(first)) : addDays(startOfDay(now), -29)
}

function buildBuckets(period: Period, start: Date, now: Date) {
  if (period === 'all') {
    const buckets: { label: string; start: Date; end: Date; reviews: number; replies: number }[] = []
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth(), 1)

    while (cursor <= last) {
      const bucketStart = new Date(cursor)
      const bucketEnd = addMonths(bucketStart, 1)
      buckets.push({ label: formatBucketLabel(bucketStart, period), start: bucketStart, end: bucketEnd, reviews: 0, replies: 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return buckets.length > 0 ? buckets : [{ label: 'Now', start, end: addDays(now, 1), reviews: 0, replies: 0 }]
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const step = period === '90d' ? 7 : 1
  const buckets = []

  for (let offset = 0; offset < days; offset += step) {
    const bucketStart = addDays(start, offset)
    const bucketEnd = addDays(bucketStart, step)
    buckets.push({ label: formatBucketLabel(bucketStart, period), start: bucketStart, end: bucketEnd, reviews: 0, replies: 0 })
  }

  return buckets
}

function buildAnalytics(reviews: Review[], period: Period, now: Date) {
  const start = getWindowStart(period, now, reviews)
  const periodConfig = PERIODS.find(p => p.value === period)
  const end = addDays(startOfDay(now), 1)
  const inPeriod = reviews.filter(review => {
    const createdAt = new Date(review.createTime).getTime()
    return Number.isFinite(createdAt) && createdAt >= start.getTime() && createdAt < end.getTime()
  })

  const total = inPeriod.length
  const replied = inPeriod.filter(review => review.status === 'replied').length
  const rate = percent(replied, total)
  const remaining = Math.max(0, total - replied)

  const previousRate = (() => {
    if (!periodConfig?.days) return rate
    const prevStart = addDays(start, -periodConfig.days)
    const prevEnd = start
    const previous = reviews.filter(review => {
      const createdAt = new Date(review.createTime).getTime()
      return Number.isFinite(createdAt) && createdAt >= prevStart.getTime() && createdAt < prevEnd.getTime()
    })
    return percent(previous.filter(review => review.status === 'replied').length, previous.length)
  })()

  const avgResponseMs = (() => {
    const durations = inPeriod
      .filter(review => review.status === 'replied')
      .map(review => {
        const createdAt = new Date(review.createTime).getTime()
        const repliedAt = new Date(review.replyUpdateTime ?? review.updateTime).getTime()
        return repliedAt - createdAt
      })
      .filter(duration => Number.isFinite(duration) && duration >= 0)

    if (durations.length === 0) return null
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  })()

  const buckets = buildBuckets(period, start, now)
  for (const review of inPeriod) {
    const createdAt = new Date(review.createTime).getTime()
    const receivedBucket = buckets.find(bucket => createdAt >= bucket.start.getTime() && createdAt < bucket.end.getTime())
    if (receivedBucket) receivedBucket.reviews += 1

    if (review.status === 'replied') {
      const repliedAt = new Date(review.replyUpdateTime ?? review.updateTime).getTime()
      const replyBucket = buckets.find(bucket => repliedAt >= bucket.start.getTime() && repliedAt < bucket.end.getTime())
      if (replyBucket) replyBucket.replies += 1
    }
  }

  return {
    total,
    replied,
    remaining,
    rate,
    comparison: rate - previousRate,
    avgResponse: avgResponseMs === null ? '-' : formatDuration(avgResponseMs),
    buckets,
  }
}

function ReplyRateChart({
  buckets,
}: {
  buckets: ReturnType<typeof buildAnalytics>['buckets']
}) {
  const maxValue = Math.max(1, ...buckets.flatMap(bucket => [bucket.reviews, bucket.replies]))
  const width = 760
  const height = 250
  const pad = { top: 18, right: 22, bottom: 42, left: 34 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom
  const xFor = (index: number) => {
    if (buckets.length <= 1) return pad.left + plotWidth / 2
    return pad.left + (plotWidth * index) / (buckets.length - 1)
  }
  const yFor = (value: number) => pad.top + plotHeight - (value / maxValue) * plotHeight
  const reviewPoints = buckets.map((bucket, index) => `${xFor(index)},${yFor(bucket.reviews)}`).join(' ')
  const replyPoints = buckets.map((bucket, index) => `${xFor(index)},${yFor(bucket.replies)}`).join(' ')

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Reviews and replies over time</h2>
          <p className="mt-1 text-xs text-slate-400">Track review intake against published replies.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
            Reviews received
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
            Replies published
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible" role="img" aria-label="Reviews received and replies published over time">
        {[0, 0.5, 1].map(tick => {
          const y = pad.top + plotHeight - plotHeight * tick
          const value = Math.round(maxValue * tick)
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{value}</text>
            </g>
          )
        })}

        <polyline points={reviewPoints} fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={replyPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {buckets.map((bucket, index) => {
          const showLabel = buckets.length <= 10 || index === 0 || index === buckets.length - 1 || index % Math.ceil(buckets.length / 5) === 0
          const x = xFor(index)

          return (
            <g key={`${bucket.label}-${index}`}>
              <circle cx={x} cy={yFor(bucket.reviews)} r="3.5" fill="#94a3b8" stroke="#fff" strokeWidth="2" />
              <circle cx={x} cy={yFor(bucket.replies)} r="3.5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
              {showLabel && (
                <text x={x} y={height - 16} textAnchor="middle" className="fill-slate-400 text-[10px]">
                  {bucket.label}
                </text>
              )}
            </g>
          )
        })}

        <line x1={pad.left} x2={width - pad.right} y1={pad.top + plotHeight} y2={pad.top + plotHeight} stroke="#cbd5e1" strokeWidth="1" />
      </svg>
    </div>
  )
}

export default function ReplyRateAnalytics() {
  const [period, setPeriod] = useState<Period>('30d')
  const [now] = useState(() => new Date())
  const reviews = useQuery(api.reviews.list, { limit: 500 })

  const analytics = useMemo(
    () => buildAnalytics(reviews ?? [], period, now),
    [reviews, period, now],
  )

  if (reviews === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-80 animate-pulse rounded-lg bg-slate-100" />
      </div>
    )
  }

  const comparisonLabel = formatComparison(analytics.comparison, period)
  const comparisonTone = analytics.comparison > 0
    ? 'text-emerald-600'
    : analytics.comparison < 0
      ? 'text-amber-600'
      : 'text-slate-500'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map(option => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              period === option.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Reply rate</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="text-4xl font-bold text-slate-950">{analytics.rate}%</p>
            <div className="pb-1">
              <p className="text-sm font-medium text-slate-700">
                {analytics.replied} of {analytics.total} reviews replied to
              </p>
              <p className={`mt-1 text-xs font-semibold ${comparisonTone}`}>
                {comparisonLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-600">Insight</p>
          <h2 className="mt-2 text-sm font-semibold text-slate-900">{insightTitle(analytics.rate, analytics.remaining)}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {insightCopy(analytics.replied, analytics.total, analytics.remaining)}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Reviews received</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Replies published</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.replied}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Average response time</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.avgResponse}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Needs attention</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.remaining}</p>
          <p className="mt-1 text-xs text-slate-400">reviews awaiting reply</p>
        </div>
      </section>

      <ReplyRateChart buckets={analytics.buckets} />
    </div>
  )
}
