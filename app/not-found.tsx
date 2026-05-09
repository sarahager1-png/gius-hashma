import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, padding: 0, background: 'var(--bg)', fontFamily: 'inherit' }}>
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #F7F5FF 0%, #F0FAFA 100%)' }}
        >
          <div
            className="rounded-[20px] border p-10 max-w-md w-full text-center"
            style={{
              background: '#fff',
              borderColor: 'var(--line)',
              boxShadow: '0 8px 40px rgba(91,62,174,.10)',
            }}
          >
            {/* Number */}
            <div
              className="text-[96px] font-black leading-none mb-2"
              style={{
                background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-.04em',
              }}
            >
              404
            </div>

            <h1
              className="text-[22px] font-extrabold mb-2 leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}
            >
              הדף לא נמצא
            </h1>
            <p
              className="text-[14px] leading-relaxed mb-8"
              style={{ color: 'var(--ink-3)' }}
            >
              הכתובת שביקשת אינה קיימת במערכת.
              <br />
              ייתכן שהקישור שגוי או שהדף הוסר.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center h-11 rounded-[12px] text-[14px] font-bold text-white no-underline transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)',
                  boxShadow: '0 4px 14px rgba(91,62,174,.28)',
                }}
              >
                חזרה ללוח הבקרה
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center h-11 rounded-[12px] text-[14px] font-semibold no-underline border transition-all"
                style={{
                  borderColor: 'var(--line)',
                  color: 'var(--ink-2)',
                  background: '#fff',
                }}
              >
                כניסה למערכת
              </Link>
            </div>

            <p
              className="text-[11px] font-medium mt-8"
              style={{ color: 'var(--ink-4)' }}
            >
              מערכת גיוס · רשת אהלי יוסף יצחק
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
