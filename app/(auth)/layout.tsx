import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DevCredit />
    </>
  )
}

function DevCredit() {
  return (
    <div style={{ position: 'fixed', bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mefateach.png" alt="מפתח · שרה הגר"
        style={{ width: 'auto', maxWidth: 140, height: 'auto', objectFit: 'contain', opacity: 0.85 }} />
    </div>
  )
}
