'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Building2, Users, BarChart2 } from 'lucide-react'

const STATS = [
  { n: '80+',  label: 'מוסדות ברשת' },
  { n: '300+', label: 'מועמדות' },
  { n: '500+', label: 'תהליכי גיוס' },
]
const FEATURES = [
  { icon: Building2, title: 'אישור מוסדות',  desc: 'פקחי ואשרי מוסדות חדשים שמבקשים להצטרף לרשת' },
  { icon: Users,     title: 'ניהול מועמדות', desc: 'צפי בכלל המועמדות, הפעלי קודי גישה ועקבי אחר תהליכים' },
  { icon: BarChart2, title: 'דוחות KPI',     desc: 'נתוני גיוס, השמות, זמני תגובה ומגמות לאורך זמן' },
]

export default function NehalLanding() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (error) { setError('שגיאה בכניסה עם גוגל'); setLoading(false) }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple-800) 0%, var(--purple) 60%, var(--teal) 100%)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '13px', fontWeight: 600 }}>חזרה</span>
            </a>
            <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,.95)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
              <Image src="/logo-chabad.png" alt="לוגו" width={28} height={28} className="object-contain" />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 0 44px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '999px', padding: '5px 14px', marginBottom: '16px' }}>
              <ShieldCheck size={13} color="white" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '.05em' }}>פורטל מנהל הרשת</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', letterSpacing: '-.03em', lineHeight: 1.15, margin: '0 0 10px' }}>
              ניהול ופיקוח<br />על כלל הרשת
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.75)', margin: '0 0 28px', lineHeight: 1.6 }}>
              מרכז שליטה לניהול מוסדות, מועמדות ותהליכי גיוס בכל הרשת
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
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--purple-800), var(--purple), var(--teal))' }} />
          <div style={{ padding: '22px 24px 20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 3px', letterSpacing: '-.01em' }}>כניסה למערכת</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 20px' }}>גישה מורשית לצוות המטה בלבד</p>

            {error && (
              <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--red)', fontWeight: 600, marginBottom: '14px' }}>{error}</div>
            )}

            <button onClick={handleGoogle} disabled={loading}
              style={{ width: '100%', height: '48px', borderRadius: '12px', background: loading ? 'var(--bg-2)' : 'white', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', boxShadow: 'var(--shadow-sm)', transition: 'all .15s' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
            >
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading ? 'מתחבר...' : 'כניסה עם חשבון Google'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ink-4)', marginTop: '12px' }}>
              גישה מורשית בלבד — נדרש חשבון ארגוני
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', paddingBottom: '40px' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'white', borderRadius: '14px', padding: '14px 12px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '34px', height: '34px', background: 'var(--purple-050)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <Icon size={16} color="var(--purple)" />
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '3px' }}>{title}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-4)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
