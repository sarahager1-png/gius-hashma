'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export default function HelpFloatButton({ hasWa = false }: { hasWa?: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/help"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: hasWa ? 88 : 24,
        left: 24,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 44,
        borderRadius: 22,
        background: 'var(--purple)',
        color: '#fff',
        textDecoration: 'none',
        boxShadow: hovered
          ? '0 6px 24px rgba(91,62,158,.55)'
          : '0 3px 14px rgba(91,62,158,.35)',
        padding: '0 16px 0 12px',
        transition: 'all .2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        fontFamily: 'inherit',
      }}
      aria-label="עזרה ומדריך"
    >
      <HelpCircle size={18} strokeWidth={2.2} color="white" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {hovered ? 'מדריך למשתמש' : 'עזרה'}
      </span>
    </Link>
  )
}
