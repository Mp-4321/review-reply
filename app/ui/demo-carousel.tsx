'use client'

import { useState, useEffect, useRef } from 'react'

type ToneLabel = 'Professional' | 'Friendly' | 'Concise'

const SLIDES = [
  {
    tone: 'Professional' as ToneLabel,
    business: 'The Meridian Hotel',
    businessType: '🏨 Hotel',
    stars: 1,
    reviewer: 'James R.',
    initials: 'JR',
    color: '#6366f1',
    review:
      "Check-in took 45 minutes with no apology from staff. The room smelled damp and the shower was broken. Despite repeated calls to reception, nothing was fixed during our 3-night stay.",
    keywords: ['James', 'The Meridian Hotel', 'experience'],
    reply:
      "Dear James,\nWe apologize for your experience at The Meridian.\nYour feedback has been escalated to our team.\nPlease contact us at hello@meridianhotel.com.\nWe'll look into this right away.",
  },
  {
    tone: 'Friendly' as ToneLabel,
    business: 'Bloom Florist',
    businessType: '🌸 Florist',
    stars: 3,
    reviewer: 'Emma T.',
    initials: 'ET',
    color: '#f59e0b',
    review:
      "The flowers were beautiful, but my order arrived 2 hours late with no warning and I had to rearrange the whole event. Lovely products — just need to sort out the delivery.",
    keywords: ['Emma', 'Bloom Florist', 'flowers', 'delivery'],
    reply:
      "Hi Emma! Your kind words about our flowers mean the world to the whole team at Bloom Florist.\nWe're truly sorry the delivery let you down.\nWe are already fixing it. Please come back soon!",
  },
  {
    tone: 'Concise' as ToneLabel,
    business: 'Smile Dental Clinic',
    businessType: '🦷 Dental Clinic',
    stars: 5,
    reviewer: 'Karen M.',
    initials: 'KM',
    color: '#ec4899',
    review:
      "Always anxious about dentist visits, but the team here made me feel completely at ease. Professional, gentle, and thorough. I'll be back.",
    keywords: ['Karen', 'Smile Dental Clinic', 'comfortable'],
    reply:
      "Thank you, Karen! The whole team at Smile Dental Clinic looks forward to your next visit.",
  },
]

const SLIDE_ALTERNATIVES = [
  {
    tone: 'Professional' as ToneLabel,
    business: 'Iron Flow Fitness',
    businessType: '🏋️ Gym',
    stars: 1,
    reviewer: 'Daniel K.',
    initials: 'DK',
    color: '#10b981',
    review:
      "The equipment is decent but the locker rooms are rarely cleaned. I reported the issue to staff twice with no result. For the monthly fee, I expected much better upkeep.",
    keywords: ['Daniel', 'Iron Flow Fitness'],
    reply:
      "Dear Daniel,\nwe apologize for your experience at Iron Gym.\nPlease contact us at hello@irongym.com.\nWe will look into this further.",
  },
  {
    tone: 'Friendly' as ToneLabel,
    business: 'La Piazza',
    businessType: '🍝 Restaurant',
    stars: 3,
    reviewer: 'Sophie L.',
    initials: 'SL',
    color: '#f97316',
    review:
      "The pasta was incredible and the atmosphere so warm and cozy. Our waiter was a little slow but made up for it with great recommendations. Will definitely be back!",
    keywords: ['Sophie', 'La Piazza', 'pasta'],
    reply:
      "Hi Sophie!\nGlad you loved the pasta and atmosphere :)\nIt means a lot to our team at La Piazza.\nWe can't wait to welcome you back!",
  },
  {
    tone: 'Concise' as ToneLabel,
    business: 'The Style Co.',
    businessType: '🛍️ Retail Store',
    stars: 5,
    reviewer: 'Tom B.',
    initials: 'TB',
    color: '#8b5cf6',
    review:
      "Great selection and super helpful staff. Found exactly what I needed in minutes. Highly recommend.",
    keywords: ['Tom', 'The Style Co.'],
    reply:
      "Thank you, Tom! The whole team at The Style Co. looks forward to your next visit.",
  },
]

const SLIDE_PAIRS = SLIDES.map((slide, i) => [slide, SLIDE_ALTERNATIVES[i]])

const TONES: ToneLabel[] = ['Professional', 'Friendly', 'Concise']

function ReplyText({ text, fullText, typing, clampLines }: { text: string; fullText: string; typing: boolean; clampLines?: number }) {
  const paragraphs = text.split('\n')
  const ghostStyle = clampLines
    ? { display: '-webkit-box' as const, WebkitLineClamp: clampLines, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
    : undefined
  return (
    <div className="relative w-full">
      {/* Ghost establishes layout height; clamped to limit panel growth */}
      <div className="invisible select-none whitespace-pre-wrap w-full" aria-hidden style={ghostStyle}>
        {fullText}
      </div>
      <div className="absolute inset-0 w-full overflow-hidden">
        {paragraphs.map((p, i) => (
          <span key={i} className="block">
            {p}
            {i === paragraphs.length - 1 && typing && (
              <span className="inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-blue-500 align-middle" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}


function StarRow({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={i < count ? '#D97706' : '#E2E8F0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export default function DemoCarousel() {
  const slidesRef = useRef(
    SLIDE_PAIRS.map(pair => pair[Math.floor(Math.random() * 2)])
  )
  const slides = slidesRef.current
  const [slideIndex, setSlideIndex]         = useState(0)
  const [displayedReply, setDisplayedReply] = useState('')
  const [contentVisible, setContentVisible] = useState(true)
  const [typing, setTyping]                 = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)

  function clearAll() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timeoutRef.current)  { clearTimeout(timeoutRef.current);   timeoutRef.current  = null }
  }

  function startSequence(idx: number) {
    timeoutRef.current = setTimeout(() => {
      setTyping(true)
      const text = slides[idx].reply
      let i = 0
      intervalRef.current = setInterval(() => {
        i++
        setDisplayedReply(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setTyping(false)
          const wait = idx === slides.length - 1 ? 3000 : 4000
          timeoutRef.current = setTimeout(() => goToSlide((idx + 1) % slides.length), wait)
        }
      }, 32)
    }, 1500)
  }

  function goToSlide(idx: number) {
    clearAll()
    setContentVisible(false)
    timeoutRef.current = setTimeout(() => {
      setSlideIndex(idx)
      setDisplayedReply('')
      setTyping(false)
      setContentVisible(true)
      startSequence(idx)
    }, 250)
  }

  useEffect(() => {
    startSequence(0)
    return clearAll
  }, [])

  const slide = slides[slideIndex]

  return (
    <div className="mt-10">
      <p className="mb-5 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
        See it in action
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Tone selector */}
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="mr-1 text-xs font-medium text-slate-400">Tone:</span>
          {TONES.map((t, i) => (
            <span
              key={t}
              onClick={() => { if (slide.tone !== t) goToSlide(i) }}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300 ${
                slide.tone === t ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t}
            </span>
          ))}
          <span className="ml-auto text-xs text-slate-500">{slide.businessType}</span>
        </div>

        <div className="mx-5 h-px bg-slate-100" />

        {/* Two-panel grid */}
        <div
          className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-3"
          style={{
            opacity: contentVisible ? 1 : 0,
            filter: contentVisible ? 'blur(0px)' : 'blur(5px)',
            transition: 'opacity 250ms ease, filter 250ms ease',
          }}
        >
          {/* Left — review (low emphasis) */}
          <div className="flex flex-col justify-start min-h-[200px] max-h-[280px] overflow-hidden rounded-2xl border border-slate-100/40 bg-slate-50/40 p-4 text-left">
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: slide.color }}
              >
                {slide.initials}
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight text-slate-900">{slide.reviewer}</p>
                <StarRow count={slide.stars} />
              </div>
            </div>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-600 [overflow-wrap:break-word] [hyphens:none]">
              {slide.review}
            </p>
          </div>

          {/* Right — AI reply (primary emphasis) */}
          <div className="mt-1 flex flex-col justify-start min-h-[200px] max-h-[280px] min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-semibold">AI-generated reply</span>
            </div>
            <div className="w-full text-[15px] leading-relaxed text-slate-800 [overflow-wrap:break-word] [word-break:break-word]">
              <ReplyText text={displayedReply} fullText={slides[slideIndex].reply} typing={typing} clampLines={6} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
