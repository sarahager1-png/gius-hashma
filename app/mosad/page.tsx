'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  School, Briefcase, Search, MessageCircle,
  CheckCircle, Clock, ClipboardList, Calendar, Star,
} from 'lucide-react'
import Link from 'next/link'
import InstallFooter from '@/components/landing/install-footer'

const STEPS = [
  {
    n: '1',
    title: 'נרשמים ומקבלים אישור',
    desc: 'מוגישים בקשת הצטרפות — מנהלת הרשת מאשרת את המוסד תוך יום עסקים',
    color: 'var(--teal)',
    bg: 'var(--teal-050)',
  },
  {
    n: '2',
    title: 'מפרסמים משרות',
    desc: 'יוצרים משרה עם כותרת, סוג, מיקום והתמחות — מיד נחשפת לכלל המועמדות',
    color: 'var(--purple)',
    bg: 'var(--purple-050)',
  },
  {
    n: '3',
    title: 'מגייסים ומשבצים',
    desc: 'עוברים על בקשות, שולחים הזמנות לראיון — המועמדת מאשרת בוואטסאפ או SMS לפי בחירתה',
    color: '#15803D',
    bg: '#DCFCE7',
  },
]

const FEATURES = [
  {
    icon: Briefcase,
    title: 'פרסום משרות',
    desc: 'סטאג׳, חלקי ומלא — כולל תאריך כניסה, תוקף, התמחות ותיאור מפורט',
    color: 'var(--teal)', bg: 'var(--teal-050)',
  },
  {
    icon: Search,
    title: 'עיון במועמדות',
    desc: 'סנני לפי התמחות, מחוז, רמה אקדמית, שנות ניסיון ויום לימודים',
    color: 'var(--purple)', bg: 'var(--purple-050)',
  },
  {
    icon: ClipboardList,
    title: 'ניהול בקשות',
    desc: 'רואים כל הגשה, צופים בפרופיל, מסמנים "נצפתה" — ומחליטים',
    color: 'var(--teal)', bg: 'var(--teal-050)',
  },
  {
    icon: Calendar,
    title: 'תיאום ראיונות',
    desc: 'שולחים הזמנה עם תאריך ומיקום — המועמדת מאשרת בוואטסאפ או SMS לפי בחירתה',
    color: '#D97706', bg: '#FFFBEB',
  },
  {
    icon: MessageCircle,
    title: 'עדכונים חכמים',
    desc: 'מקבלים התראות בזמן אמת — וגם אתם בוחרים וואטסאפ או SMS לפי ההעדפה',
    color: '#15803D', bg: '#DCFCE7',
  },
  {
    icon: Star,
    title: 'המלצות חכמות',
    desc: 'המערכת מציעה מועמדות שמתאימות למשרה שלכם אוטומטית',
    color: 'var(--purple)', bg: 'var(--purple-050)',
  },
]

const PROCESS = [
  { icon: ClipboardList, label: 'הגשה',       status: 'ממתינה',   color: '#5B21B6', bg: '#F5F3FF' },
  { icon: Search,        label: 'נצפתה',      status: 'נצפתה',    color: '#0369A1', bg: '#E0F2FE' },
  { icon: Calendar,      label: 'ראיון',      status: 'הוזמנה',   color: '#D97706', bg: '#FEF3C7' },
  { icon: CheckCircle,   label: 'שיבוץ',     status: 'התקבלה',   color: '#166534', bg: '#DCFCE7' },
]

const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function MosadLanding() {
  const [pending, setPending] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setPending(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/register/institution` },
    })
    if (err) { setError('שגיאה בכניסה עם Google. נסי שוב.'); setPending(false) }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #007680 0%, var(--teal) 50%, var(--purple) 100%)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '13px', fontWeight: 600 }}>חזרה</span>
            </Link>
            <div style={{ width: '52px', height: '52px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.18)', padding: '4px' }}>
              <Image src="/logo-chabad.png" alt="לוגו" width={44} height={44} className="object-contain" />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 0 44px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '999px', padding: '5px 14px', marginBottom: '16px' }}>
              <School size={13} color="white" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '.05em' }}>פורטל המוסד</span>
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: 900, color: 'white', letterSpacing: '-.03em', lineHeight: 1.12, margin: '0 0 12px' }}>
              גייסי את<br />שליחות החינוך הנכונה
            </h1>
            <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,.82)', margin: '0', lineHeight: 1.6 }}>
              מאגר מועמדות מאומתות, מנוהל ברשת חינוך חב״ד —<br />פרסמי משרה ומצאי מועמדת תוך ימים
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── About ── */}
        <div style={{ marginTop: '8px', marginBottom: '16px', background: 'white', borderRadius: '16px', padding: '18px 20px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: 'var(--ink)' }}>מערכת גיוס.us</strong> היא הפלטפורמה הרשמית של רשת חינוך חב״ד לגיוס מורות, גננות וסטאג׳יריות.
            <br /><br />
            מפרסמים משרה, עוברים על פרופילי מועמדות מסוננות, ושולחים הזמנה לראיון — הכל במקום אחד. כל צד בוחר את ערוץ התקשורת שנוח לו — וואטסאפ או SMS.
          </p>
        </div>

        {/* ── Login card ── */}
        <div style={{ marginTop: '-20px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,167,181,.14)', border: '1px solid var(--line)', marginBottom: '24px' }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--teal), var(--purple))' }} />
          <div style={{ padding: '24px 24px 22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 3px', letterSpacing: '-.01em' }}>כניסה למערכת</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 20px' }}>
              מוסד חדש? תועברו לטופס הרשמה — אישור תוך יום עסקים
            </p>

            <button onClick={handleGoogle} disabled={pending}
              style={{ width: '100%', height: '52px', borderRadius: '13px', background: pending ? 'var(--bg-2)' : '#fff', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: pending ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: 800, color: 'var(--ink)', boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'all .15s' }}
              onMouseEnter={e => { if (!pending) { e.currentTarget.style.borderColor = 'var(--teal-100)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,167,181,.12)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}
            >
              {!pending && GOOGLE_SVG}
              <span>{pending ? 'מחברת...' : 'כניסה עם Google'}</span>
            </button>

            {error && (
              <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--red)', fontWeight: 600, marginTop: '12px' }}>{error}</div>
            )}

            {/* Trust row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              {[
                { icon: CheckCircle, text: 'ניהול חינמי' },
                { icon: Clock, text: 'אישור תוך יום' },
                { icon: MessageCircle, text: 'וואטסאפ או SMS לבחירה' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--ink-4)', fontWeight: 600 }}>
                  <Icon size={12} color="var(--green)" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>איך זה עובד</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'white', borderRadius: '14px', padding: '14px 16px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 900, color: s.color }}>
                  {s.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', marginBottom: '2px' }}>{s.title}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-3)', lineHeight: 1.45 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Status flow ── */}
        <div style={{ marginBottom: '24px', background: 'white', borderRadius: '16px', padding: '16px 18px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '14px', margin: '0 0 14px' }}>מחזור חיים של הגשה</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {PROCESS.map((p, i) => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p.icon size={16} color={p.color} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: p.color }}>{p.label}</span>
                </div>
                {i < PROCESS.length - 1 && (
                  <div style={{ width: '20px', height: '1px', background: 'var(--line)', marginBottom: '16px', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>כלים לניהול הגיוס</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
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
        <div style={{ background: 'linear-gradient(135deg, #007680 0%, var(--teal) 60%, var(--purple) 100%)', borderRadius: '18px', padding: '22px 20px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '6px' }}>מוכנים לגייס?</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.75)', marginBottom: '16px' }}>הצטרפו לרשת — אישור מהיר, ניהול פשוט</div>
          <button onClick={handleGoogle} disabled={pending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '12px', padding: '11px 22px', border: 'none', cursor: pending ? 'default' : 'pointer', fontSize: '14px', fontWeight: 800, color: 'var(--teal-600)', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,.15)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.15)' }}
          >
            {!pending && GOOGLE_SVG}
            {pending ? 'מחברת...' : 'כניסה עם Google'}
          </button>
        </div>
      </div>

      <InstallFooter />
    </div>
  )
}
