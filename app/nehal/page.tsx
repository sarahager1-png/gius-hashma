'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Users, BarChart2, ShieldCheck, Bell,
  FileDown, ClipboardList, CheckCircle, Settings, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import InstallFooter from '@/components/landing/install-footer'

const ADMIN_TOOLS = [
  {
    icon: Building2,
    title: 'אישור מוסדות',
    desc: 'מוסדות חדשים שהגישו בקשה — עוברים, בוחנים, מאשרים או דוחים',
    color: 'var(--purple)', bg: 'var(--purple-050)',
  },
  {
    icon: Users,
    title: 'ניהול מועמדות',
    desc: 'צפייה בכלל המועמדות הרשומות, עריכת פרטים, מעקב אחר תהליכים',
    color: 'var(--teal)', bg: 'var(--teal-050)',
  },
  {
    icon: ClipboardList,
    title: 'ניהול משרות',
    desc: 'יצירת משרות עבור מוסדות, עריכה, השהיה וסגירה — מכל מקום',
    color: 'var(--purple)', bg: 'var(--purple-050)',
  },
  {
    icon: TrendingUp,
    title: 'מגמות וניתוח',
    desc: 'גרפים של מועמדות, שיבוצים ומשרות לאורך 30 יום / 6 חודשים / שנה',
    color: 'var(--teal)', bg: 'var(--teal-050)',
  },
  {
    icon: Bell,
    title: 'ניטור התראות',
    desc: 'מוסדות לא מגיבים, ראיונות ללא אישור, משרות ללא מגישות — בזמן אמת',
    color: '#D97706', bg: '#FEF3C7',
  },
  {
    icon: BarChart2,
    title: 'דוחות KPI',
    desc: 'מדד המרה, זמן ממוצע לשיבוץ, פעילות לפי מחוז ועוד',
    color: 'var(--purple)', bg: 'var(--purple-050)',
  },
  {
    icon: FileDown,
    title: 'יצוא נתונים',
    desc: 'CSV מלא של שיבוצים ומועמדות — מוכן לפגישות ודיווחים',
    color: 'var(--teal)', bg: 'var(--teal-050)',
  },
  {
    icon: Settings,
    title: 'ניהול מערכת',
    desc: 'קודי גישה, ניהול אדמינים, הרצת מיגרציות ואפשרויות מתקדמות',
    color: '#D97706', bg: '#FEF3C7',
  },
]

const DASHBOARDS = [
  {
    title: 'לוח בקרה ראשי',
    items: ['KPI cards — מועמדות, משרות, שיבוצים, ראיונות', 'תרשים מגמות לאורך זמן', 'פיד פעילות אחרונה בזמן אמת'],
  },
  {
    title: 'ניהול יישויות',
    items: ['רשימת כל המוסדות + מצב אישור', 'כל המועמדות + פרופיל מלא', 'כל המשרות + מספר הגשות'],
  },
  {
    title: 'תהליכי גיוס',
    desc: '',
    items: ['הגשות ממתינות לבדיקה', 'ראיונות קרובים + אישורי נוכחות', 'שיבוצים שהושלמו + דוחות'],
  },
]

export default function NehalLanding() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (err) { setError('שגיאה בכניסה עם גוגל'); setLoading(false) }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #0F0623 0%, #1A0B35 30%, #2D1B5C 65%, #3D2570 100%)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', fontWeight: 600 }}>חזרה</span>
            </Link>
            <div style={{ width: '52px', height: '52px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.3)', padding: '4px' }}>
              <Image src="/logo-chabad.png" alt="לוגו" width={44} height={44} className="object-contain" />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 0 44px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '999px', padding: '5px 14px', marginBottom: '16px' }}>
              <ShieldCheck size={13} color="rgba(255,255,255,.8)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.8)', letterSpacing: '.05em' }}>מנהלת מערכת</span>
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: 900, color: 'white', letterSpacing: '-.03em', lineHeight: 1.12, margin: '0 0 12px' }}>
              לוח בקרה<br />ניהול הרשת
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)', margin: '0', lineHeight: 1.6 }}>
              גישה מורשית לצוות המטה בלבד<br />כל הכלים לניהול, ניטור ודיווח במקום אחד
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── Login card ── */}
        <div style={{ marginTop: '-20px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(15,6,35,.2)', border: '1px solid var(--line)', marginBottom: '24px' }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #1A0B35, var(--purple), var(--teal))' }} />
          <div style={{ padding: '24px 24px 22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 3px', letterSpacing: '-.01em' }}>כניסה למערכת</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 20px' }}>גישה מורשית — נדרש חשבון ארגוני מאושר</p>

            {error && (
              <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--red)', fontWeight: 600, marginBottom: '14px' }}>{error}</div>
            )}

            <button onClick={handleGoogle} disabled={loading}
              style={{ width: '100%', height: '52px', borderRadius: '13px', background: loading ? 'var(--bg-2)' : 'white', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: 800, color: 'var(--ink)', boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'all .15s' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,58,171,.12)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}
            >
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{loading ? 'מתחבר...' : 'כניסה עם חשבון Google'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
              {[
                { icon: ShieldCheck, text: 'גישה מאובטחת' },
                { icon: CheckCircle, text: 'נדרש אישור מנהל' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--ink-4)', fontWeight: 600 }}>
                  <Icon size={12} color="var(--purple)" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Dashboard sections ── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>מה נמצא בלוח הבקרה</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DASHBOARDS.map(d => (
              <div key={d.title} style={{ background: 'white', borderRadius: '14px', padding: '14px 16px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>{d.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {d.items.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--purple)', marginTop: '6px', flexShrink: 0 }} />
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-3)', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Admin tools ── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>כלי ניהול</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {ADMIN_TOOLS.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} style={{ background: 'white', borderRadius: '14px', padding: '14px 13px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '9px' }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-4)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ background: 'linear-gradient(135deg, #1A0B35 0%, #2D1B5C 50%, #3D2570 100%)', borderRadius: '18px', padding: '22px 20px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '6px' }}>מוכנות לנהל?</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)', marginBottom: '16px' }}>כניסה עם חשבון ארגוני מאושר</div>
          <button onClick={handleGoogle} disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '12px', padding: '11px 22px', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: '14px', fontWeight: 800, color: 'var(--purple)', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,.2)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.2)' }}
          >
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'מתחבר...' : 'כניסה עם Google'}
          </button>
        </div>
      </div>

      <InstallFooter />
    </div>
  )
}
