'use client'

import { useState, useEffect } from 'react'

const WORDS = ['Customers', 'Bookings', 'Revenue']

export default function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className="inline-block min-w-[10rem] text-blue-600"
      style={{
        opacity: visible ? 1 : 0,
        filter: visible ? 'blur(0px)' : 'blur(3px)',
        transition: 'opacity 300ms ease, filter 300ms ease',
      }}
    >
      {WORDS[index]}.
    </span>
  )
}
