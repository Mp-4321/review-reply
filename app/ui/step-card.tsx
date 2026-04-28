'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function AnimatedStepCard({
  children,
  outerClassName,
  innerClassName,
}: {
  children: ReactNode
  outerClassName: string
  innerClassName: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(timer)
          setVisible(true)
          timer = setTimeout(() => setVisible(false), 2500)
        }
      },
      { threshold: 0.35 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div ref={ref} className={`relative overflow-hidden ${outerClassName}`}>
      <div
        style={{
          position: 'absolute',
          inset: '-100%',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease',
          background: 'conic-gradient(from 0deg, transparent 35%, #93c5fd 50%, #a78bfa 65%, transparent 80%)',
          animation: 'card-border-spin 2.5s linear infinite',
        }}
      />
      <div className={`relative bg-slate-50 p-5 ${innerClassName}`} style={{ margin: 2 }}>
        {children}
      </div>
    </div>
  )
}
