'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Heebo, system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #F7F5FF 0%, #F0FAFA 100%)',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 8px 40px rgba(91,62,174,.10)',
              border: '1px solid #EDE9FE',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '28px',
              }}
            >
              ⚠
            </div>

            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#1A1533',
                marginBottom: '8px',
                letterSpacing: '-.02em',
              }}
            >
              משהו השתבש
            </h1>

            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px', lineHeight: 1.6 }}>
              אירעה שגיאה בלתי צפויה. נסי לרענן את הדף.
            </p>

            {error.message && (
              <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '24px' }}>
                {error.message}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={reset}
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #5B3EAE 0%, #00B1AE 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 14px rgba(91,62,174,.28)',
                }}
              >
                נסי שוב
              </button>

              <Link
                href="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E0EA',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#4B3583',
                  textDecoration: 'none',
                  background: '#fff',
                }}
              >
                חזרה ללוח הבקרה
              </Link>

              <Link
                href="/login"
                style={{
                  fontSize: '13px',
                  color: '#94A3B8',
                  textDecoration: 'none',
                  marginTop: '4px',
                }}
              >
                כניסה למערכת
              </Link>
            </div>

            <p style={{ fontSize: '11px', color: '#C4C0D4', marginTop: '28px' }}>
              מערכת גיוס · רשת אהלי יוסף יצחק
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
