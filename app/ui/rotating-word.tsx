'use client'

import { useState, useEffect } from 'react'

const WORDS = ['Customers', 'Bookings', 'Revenue']
const DEFAULT_WORD_INDEX = 0

export default function RotatingWord() {
  const [index, setIndex] = useState(DEFAULT_WORD_INDEX)
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const renderedIndex = mounted ? index : DEFAULT_WORD_INDEX

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let timeout: ReturnType<typeof setTimeout> | null = null
    const interval = setInterval(() => {
      setVisible(false)
      timeout = setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, 300)
    }, 2500)

    return () => {
      clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [mounted])

  return (
    <span
      className="inline-block min-w-[5em] text-left bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_6px_16px_rgba(59,130,246,0.22)]"
      style={{
        opacity: visible ? 1 : 0,
        filter: visible ? 'blur(0px)' : 'blur(3px)',
        transition: 'opacity 300ms ease, filter 300ms ease',
      }}
    >
      {WORDS[renderedIndex]}
    </span>
  )
}
