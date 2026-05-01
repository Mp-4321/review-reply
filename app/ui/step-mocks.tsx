'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

const REPLY = "We are really sorry about this!\nPlease reach out — we'll make it right."

// Module-level state for Step 3↔4 coordination
let step3Visible = false
let step3AnimDone = false

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
          step3Visible = true
          step3AnimDone = false
          setTyped(0)
          let n = 0
          iv = setInterval(() => {
            n++
            setTyped(n)
            if (n >= REPLY.length) {
              clearInterval(iv)
              step3AnimDone = true
              window.dispatchEvent(new CustomEvent('step3-done'))
            }
          }, 38)
        } else {
          step3Visible = false
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

const REPLACEMENT_TAIL = "we'll do our best!"

export function StepMock4() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let pendingStart: ReturnType<typeof setTimeout> | null = null
    let waitingForStep3 = false

    const onStep3Done = () => {
      waitingForStep3 = false
      window.removeEventListener('step3-done', onStep3Done)
      triggerAnimation()
    }

    const reset = () => {
      timers.forEach(clearTimeout)
      if (pendingStart) { clearTimeout(pendingStart); pendingStart = null }
      if (waitingForStep3) {
        window.removeEventListener('step3-done', onStep3Done)
        waitingForStep3 = false
      }
      setPhase('idle')
    }

    // Schedules the phase sequence after 600ms
    const triggerAnimation = () => {
      pendingStart = setTimeout(() => {
        pendingStart = null
        timers.push(setTimeout(() => setPhase('highlight'),    0))
        timers.push(setTimeout(() => setPhase('strike'),    1500))
        timers.push(setTimeout(() => setPhase('typing'),    2200))
        timers.push(setTimeout(() => setPhase('done'),      2250))
      }, 600)
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reset()
          if (step3Visible && !step3AnimDone) {
            // Step 3 is mid-animation — wait for it to finish
            waitingForStep3 = true
            window.addEventListener('step3-done', onStep3Done)
          } else {
            // Step 3 not visible or already done — start independently
            triggerAnimation()
          }
        } else {
          reset()
        }
      },
      { threshold: 0.5 }
    )

    obs.observe(el)
    return () => { obs.disconnect(); reset() }
  }, [])

  const isHighlighted = phase === 'highlight'
  const isStrike = phase === 'strike'
  const showReplacement = phase === 'typing' || phase === 'done'

  const origStyle: CSSProperties = {
    borderRadius: 2,
    padding: '0 2px',
    backgroundImage: 'linear-gradient(to right, #fef3c7, #fef3c7)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left',
    backgroundSize: isHighlighted ? '100% 100%' : '0% 100%',
    opacity: isStrike ? 0 : 1,
    transition: 'background-size 1.2s ease, opacity 0.4s ease',
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
            <span style={{ display: 'inline-grid', verticalAlign: 'bottom' }}>
              <span style={{ ...origStyle, gridArea: '1/1', opacity: showReplacement ? 0 : origStyle.opacity as number, transition: showReplacement ? 'opacity 0.4s ease' : origStyle.transition as string }}>
                we&rsquo;ll make it right.&rdquo;
              </span>
              <span style={{ gridArea: '1/1', opacity: showReplacement && phase === 'done' ? 1 : 0, transition: 'opacity 0.8s ease' }}>
                {REPLACEMENT_TAIL}&rdquo;
              </span>
            </span>
          </span>
        </p>
      </div>
      <div className="flex gap-4 pl-[19px] pr-2 pb-2">
        <div className="w-20 rounded-md border border-slate-200 py-1 text-center text-[11px] font-medium text-slate-500">Edit</div>
        <div className="w-20 rounded-md bg-emerald-100 py-1 text-center text-[11px] font-medium text-emerald-700"><span className="text-[11px] mr-1">✓</span>Approve</div>
      </div>
    </div>
  )
}
