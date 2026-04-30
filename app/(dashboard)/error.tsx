'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Heebo, system-ui', background: '#F8F7FF', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #EDE9FE' }}>
        <h2 style={{ color: '#DC2626', fontWeight: 800, fontSize: '20px', marginBottom: '12px' }}>שגיאה בטעינת הדשבורד</h2>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
          {error.message || 'שגיאה לא ידועה'}
        </p>
        <pre style={{ background: '#F1F5F9', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#334155', overflow: 'auto', marginBottom: '20px', direction: 'ltr', textAlign: 'left' }}>
          {error.stack ?? error.digest ?? 'אין פרטים נוספים'}
        </pre>
        <button onClick={reset} style={{ background: 'var(--purple)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
          נסי שוב
        </button>
        <a href="/login" style={{ display: 'block', marginTop: '12px', color: 'var(--purple)', fontSize: '13px', textAlign: 'center' }}>
          חזרה לדף כניסה
        </a>
      </div>
    </div>
  )
}
