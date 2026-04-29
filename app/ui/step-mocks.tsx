'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

const REPLY = "We're truly sorry about it. Please reach out.\nWe will make it right!"

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
          }, 25)
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
    <div ref={ref} className="mt-3 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-xs">
      <div className="rounded-lg bg-white p-2 border border-slate-200">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer review</span>
          <span className="text-xs leading-none text-amber-400">★☆☆☆☆</span>
        </div>
        <p className="leading-snug text-slate-600">&ldquo;Waited 30 minutes. This is not good!&rdquo;</p>
      </div>
      <div className="flex justify-center py-1">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-200">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-md shadow-blue-400/30">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-300">AI reply</p>
        <p className="mb-1.5 grid min-h-[2.25rem] items-start leading-snug text-white" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span>&ldquo;</span>
          <span>
            {l1}
            {l2 !== undefined && <><br />{l2}</>}
            {done
              ? <>&rdquo;</>
              : <span className="inline-block h-[0.75em] w-px bg-white/80 animate-pulse align-middle ml-px" />
            }
          </span>
        </p>
        <div className="flex items-center gap-1 rounded border border-blue-400/40 bg-blue-700/40 px-1.5 py-1 text-[10px] text-white/70">
          <span>Tone: <span className="font-semibold text-white">Friendly</span></span>
          <svg className="ml-auto h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export function StepMock4() {
  const ref = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let t: ReturnType<typeof setTimeout>

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          t = setTimeout(() => setLit(true), 350)
        } else {
          clearTimeout(t)
          setLit(false)
        }
      },
      { threshold: 0.5 }
    )

    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(t) }
  }, [])

  const hl: CSSProperties = {
    backgroundColor: lit ? 'rgba(251,191,36,0.35)' : 'transparent',
    borderRadius: 2,
    padding: '0 1px',
    transition: 'background-color 0.5s ease',
  }
  const hl2: CSSProperties = {
    ...hl,
    transition: 'background-color 0.5s ease 0.3s',
  }

  return (
    <div ref={ref} className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 text-xs">
      <div className="border-b border-slate-50 p-3">
        <p className="mb-1 text-[10px] text-slate-400">Generated reply</p>
        <p className="grid items-start leading-snug text-slate-700" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span>&ldquo;</span>
          <span>
            We&rsquo;re truly sorry about it. Please reach{' '}
            <span style={hl}>out.</span>
            <br />
            We will make it{' '}
            <span style={hl2}>right!&rdquo;</span>
          </span>
        </p>
      </div>
      <div className="flex gap-2 p-2.5">
        <div className="flex-1 rounded-md border border-slate-200 py-1.5 text-center font-medium text-slate-500">Edit</div>
        <div className="flex-1 rounded-md bg-emerald-500 py-1.5 text-center font-medium text-white">✓ Approve</div>
      </div>
    </div>
  )
}
