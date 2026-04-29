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
      <div className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer Review</p>
          <span className="text-xs leading-none text-amber-400">★☆☆☆☆</span>
        </div>
        <p className="leading-snug text-slate-500">&ldquo;Waited 30 minutes. This is not good!&rdquo;</p>
      </div>
      <div className="mt-2 rounded-xl bg-blue-50 p-2 ring-1 ring-blue-100">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">AI Reply</p>
          <span className="mr-2 text-[10px] font-medium text-slate-600">▶ Friendly</span>
        </div>
        <p className="grid min-h-[2rem] items-start leading-snug text-slate-700" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span>&ldquo;</span>
          <span>
            {l1}
            {l2 !== undefined && <><br />{l2}</>}
            {done
              ? <>&rdquo;</>
              : <span className="inline-block h-[0.75em] w-px bg-blue-600/80 animate-pulse align-middle ml-px" />
            }
          </span>
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
      <div className="p-2">
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
      <div className="flex gap-3 px-2 pb-2">
        <div className="w-20 rounded-md border border-slate-200 py-1 text-center text-xs font-medium text-slate-500">Edit</div>
        <div className="ml-4 w-20 rounded-md bg-emerald-500 py-1 text-center text-xs font-medium text-white">✓ Approve</div>
      </div>
    </div>
  )
}
