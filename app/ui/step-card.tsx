'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export function AnimatedStepCard({
  children,
  outerClassName,
  innerClassName,
}: {
  children: ReactNode
  outerClassName: string
  innerClassName: string
}) {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>

    const handleOtherActive = (e: Event) => {
      const { detail } = e as CustomEvent<{ id: string }>
      if (detail.id !== id) {
        clearTimeout(timer)
        setVisible(false)
      }
    }
    window.addEventListener('step-card-active', handleOtherActive)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.dispatchEvent(new CustomEvent('step-card-active', { detail: { id } }))
          clearTimeout(timer)
          setVisible(true)
          timer = setTimeout(() => setVisible(false), 4500)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      window.removeEventListener('step-card-active', handleOtherActive)
      clearTimeout(timer)
    }
  }, [id])

  return (
    <div ref={ref} className={`relative overflow-visible ${outerClassName}`}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease',
          background: 'conic-gradient(from 0deg, transparent 35%, #93c5fd 50%, #a78bfa 65%, transparent 80%)',
          animation: 'card-border-spin 2.5s linear infinite',
        }}
      />
      <div className={`relative bg-slate-50 ${innerClassName}`} style={{ margin: 2 }}>
        {children}
      </div>
    </div>
  )
}
