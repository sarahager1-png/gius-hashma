'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Search, FileText, Star } from 'lucide-react'
import InstallFooter from '@/components/landing/install-footer'

const STATS = [
  { n: '50+', label: 'משרות פתוחות' },
  { n: '80+', label: 'בתי ספר שותפים' },
  { n: '300+', label: 'מועמדות רשומות' },
]
const FEATURES = [
  { icon: Search,   title: 'חיפוש משרות',    desc: 'סנני לפי מחוז, סוג משרה ושעות — מצאי בדיוק את מה שמתאים' },
  { icon: FileText, title: 'פרופיל מקצועי', desc: 'בני פרופיל שלם עם קורות חיים, ניסיון וכישורים' },
  { icon: Star,     title: 'מעקב הגשות',    desc: 'ראי את סטטוס כל בקשה בזמן אמת ועדכוני מוסדות' },
]

const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function MumedetLanding() {
  const [pending, setPending] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setPending(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/register/candidate` },
    })
    if (err) { setError('שגיאה בכניסה עם Google. נסי שוב.'); setPending(false) }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '13px', fontWeight: 600 }}>חזרה</span>
            </a>
            <div style={{ width: '52px', height: '52px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.18)', padding: '4px' }}>
              <Image src="/logo-chabad.png" alt="לוגו" width={44} height={44} className="object-contain" />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 0 44px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '999px', padding: '5px 14px', marginBottom: '16px' }}>
              <GraduationCap size={13} color="white" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '.05em' }}>פורטל המועמדת</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-.03em', lineHeight: 1.15, margin: '0 0 10px' }}>
              מצאי את<br />המשרה המושלמת
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.75)', margin: '0 0 28px', lineHeight: 1.6 }}>
              הצטרפי לרשת מועמדות ההוראה הגדולה ביותר בחינוך חב״ד
            </p>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.12)', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.18)' }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{ flex: 1, padding: '13px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-.02em' }}>{s.n}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

        {/* Login card */}
        <div style={{ marginTop: '-20px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(91,58,171,.14)', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--purple), var(--teal))' }} />
          <div style={{ padding: '24px 24px 22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 3px', letterSpacing: '-.01em' }}>כניסה למערכת</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 20px' }}>התחברי עם חשבון Google שלך</p>

            <button onClick={handleGoogle} disabled={pending}
              style={{ width: '100%', height: '52px', borderRadius: '13px', background: pending ? 'var(--bg-2)' : '#fff', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: pending ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: 800, color: 'var(--ink)', boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'all .15s' }}
              onMouseEnter={e => { if (!pending) { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,58,171,.12)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}
            >
              {!pending && GOOGLE_SVG}
              <span>{pending ? 'מחברת...' : 'כניסה עם Google'}</span>
            </button>

            {error && (
              <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--red)', fontWeight: 600, marginTop: '12px' }}>{error}</div>
            )}

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ink-4)', marginTop: '14px', lineHeight: 1.5 }}>
              מועמדת חדשה? לחצי "כניסה עם Google" — תועברי להשלמת הפרופיל
            </p>
          </div>
        </div>

        {/* Feature chips — compact */}
        <div style={{ display: 'flex', gap: '7px', paddingBottom: '28px', flexWrap: 'wrap' }}>
          {FEATURES.map(({ icon: Icon, title }) => (
            <div key={title} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', background: 'white', borderRadius: '10px', padding: '8px 10px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '22px', height: '22px', background: 'var(--purple-050)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={12} color="var(--purple)" />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>{title}</span>
            </div>
          ))}
        </div>
      </div>

      <InstallFooter />
    </div>
  )
}
