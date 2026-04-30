'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

const REPLY = "We are really sorry about this!\nPlease reach out — we'll make it right."

export function StepMock3() {
  const ref = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let iv: ReturnType<typeof setInterval>

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTyped(0)
          let n = 0
          iv = setInterval(() => {
            n++
            setTyped(n)
            if (n >= REPLY.length) clearInterval(iv)
          }, 38)
        } else {
          clearInterval(iv)
          setTyped(0)
        }
      },
      { threshold: 0.5 }
    )

    obs.observe(el)
    return () => { obs.disconnect(); clearInterval(iv) }
  }, [])

  const text = REPLY.slice(0, typed)
  const [l1, l2] = text.split('\n')
  const done = typed >= REPLY.length

  return (
    <div ref={ref} className="mt-3 text-xs">
      <div className="mx-auto w-[88%] sm:-translate-x-3 rounded-2xl bg-white px-5 py-2 ring-1 ring-slate-200 shadow-sm shadow-slate-200/50">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="leading-none text-[10px] font-semibold uppercase tracking-wide text-[#7c8ca2]">Customer Review</span>
          <span className="pr-[5px] mr-[3px] text-[10px] text-amber-400">★☆☆☆☆</span>
        </div>
        <p className="leading-snug text-slate-500">&ldquo;Waited 30 minutes. This is not good!&rdquo;</p>
      </div>
      <div className="mx-auto mt-4 w-[88%] sm:translate-x-1 rounded-2xl bg-blue-50 px-5 py-2 ring-1 ring-blue-200 shadow-md shadow-blue-100/70">
        <div className="flex items-center justify-between pb-2 border-b border-blue-100/70">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-500"><svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> AI Reply</p>
          <span className="text-[10px] font-medium text-slate-600">Friendly<span className="relative top-[-2px] ml-1">⌄</span></span>
        </div>
        <p className="mt-2 min-h-[2rem] leading-snug text-slate-700">
          &ldquo;{l1}
          {l2 !== undefined && <><br />{l2}</>}
          {done ? <>&rdquo;</> : <span className="inline-block h-[0.75em] w-px bg-blue-600/80 animate-pulse align-middle ml-px" />}
        </p>
      </div>
    </div>
  )
}

type Phase = 'idle' | 'highlight' | 'strike' | 'typing' | 'done'

const REPLACEMENT = "we'll do our best."

export function StepMock4() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let iv: ReturnType<typeof setInterval>

    const reset = () => {
      timers.forEach(clearTimeout)
      clearInterval(iv)
      setPhase('idle')
      setTyped(0)
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reset()
          // t=400ms: highlight on
          timers.push(setTimeout(() => setPhase('highlight'), 400))
          // t=1900ms: strikethrough + fade out (highlight lasted 1.5s)
          timers.push(setTimeout(() => setPhase('strike'), 1900))
          // t=3400ms: typewriter starts (1s fade + 0.5s gap)
          timers.push(setTimeout(() => {
            setPhase('typing')
            let n = 0
            iv = setInterval(() => {
              n++
              setTyped(n)
              if (n >= REPLACEMENT.length) {
                clearInterval(iv)
                setPhase('done')
              }
            }, 45)
          }, 3400))
        } else {
          reset()
        }
      },
      { threshold: 0.5 }
    )

    obs.observe(el)
    return () => { obs.disconnect(); reset() }
  }, [])

  const showOriginal = phase === 'idle' || phase === 'highlight' || phase === 'strike'
  const origStyle: CSSProperties = {
    borderRadius: 2,
    padding: '0 2px',
    backgroundColor: phase === 'idle' ? 'transparent' : '#fef3c7',
    opacity: phase === 'strike' ? 0 : 1,
    transition: 'background-color 0.4s ease, opacity 0.6s ease',
  }

  return (
    <div ref={ref} className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 text-xs">
      <div className="pl-[19px] pr-2 pt-2 pb-2">
        <p className="mb-1 text-[10px] text-slate-400">Generated reply</p>
        <p className="grid items-start leading-snug text-slate-700" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span>&ldquo;</span>
          <span>
            We are really sorry about this!<br />
            Please reach out &mdash;{' '}
            {showOriginal
              ? <span style={origStyle}>we&rsquo;ll make it right.&rdquo;</span>
              : <span>
                  {REPLACEMENT.slice(0, typed)}&rdquo;
                  {phase === 'typing' && <span className="inline-block h-[0.75em] w-px bg-slate-700 animate-pulse align-middle ml-px" />}
                </span>
            }
          </span>
        </p>
      </div>
      <div className="flex gap-4 pl-[19px] pr-2 pb-2">
        <div className="w-20 rounded-md border border-slate-200 py-1 text-center text-[11px] font-medium text-slate-500">Edit</div>
        <div className="w-20 rounded-md bg-emerald-500 py-1 text-center text-[11px] font-medium text-white">✓ Approve</div>
      </div>
    </div>
  )
}
