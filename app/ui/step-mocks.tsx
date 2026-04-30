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
      <div className="mx-auto w-[88%] sm:-translate-x-2 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200 shadow-sm shadow-slate-200/50">
        <div className="mb-1.5 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer Review</span>
          <span className="text-[10px] leading-none text-amber-400">★☆☆☆☆</span>
        </div>
        <p className="leading-snug text-slate-500">&ldquo;Waited 30 minutes. This is not good!&rdquo;</p>
      </div>
      <div className="mx-auto mt-4 w-[88%] sm:translate-x-1 rounded-2xl bg-blue-50 px-5 py-4 ring-1 ring-blue-200 shadow-md shadow-blue-100/70">
        <div className="flex items-center justify-between pb-2 border-b border-blue-100/70">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500"><span style={{ filter: 'hue-rotate(200deg) saturate(2)' }}>✨</span> AI Reply</p>
          <span className="text-[10px] font-medium text-slate-500">Friendly<span className="relative top-[-2px] ml-1">⌄</span></span>
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
      <div className="pl-[15px] pr-2 pt-2 pb-2">
        <p className="mb-1 text-[10px] text-slate-400">Generated reply</p>
        <p className="grid items-start leading-snug text-slate-700" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span>&ldquo;</span>
          <span>
            We are really sorry about this!<br />
            Please reach out &mdash;{' '}
            <span style={hl}>we&rsquo;ll make it{' '}</span>
            <span style={hl2}>right.&rdquo;</span>
          </span>
        </p>
      </div>
      <div className="flex gap-4 pl-[15px] pr-2 pb-2">
        <div className="w-20 rounded-md border border-slate-200 py-1 text-center text-xs font-medium text-slate-500">Edit</div>
        <div className="w-20 rounded-md bg-emerald-500 py-1 text-center text-xs font-medium text-white">✓ Approve</div>
      </div>
    </div>
  )
}
