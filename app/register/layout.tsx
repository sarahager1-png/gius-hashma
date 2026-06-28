import type { ReactNode } from 'react'

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <a
        href="https://wa.me/972503339770"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          color: 'rgba(0,0,0,.35)',
          textDecoration: 'none',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          zIndex: 50,
          lineHeight: 1.5,
        }}
      >
        פיתוח ובניית אתר: שרה הגר ·{' '}
        <span style={{ color: '#00A7B5' }}>0503339770</span>
        <span style={{ display: 'block', marginTop: '2px' }}>יעוץ ארגוני | פתרונות דיגיטליים · מהבנת הארגון לפתרון שעובד.</span>
      </a>
    </>
  )
}
