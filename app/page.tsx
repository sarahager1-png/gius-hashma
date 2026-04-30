'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap, School, ShieldCheck,
  Search, FileText, Star, Briefcase, Users, BarChart2, Building2,
  Eye, EyeOff,
} from 'lucide-react'

type RoleId = 'mumedet' | 'mosad' | 'nehal'

const ROLES = [
  {
    id: 'mumedet' as RoleId,
    Icon: GraduationCap,
    label: 'מועמדת',
    tag: 'פורטל מועמדות',
    headline: 'מצאי את המשרה המושלמת',
    sub: 'עשרות משרות שליחות חינוך פתוחות ברשת חב״ד — סטאג׳, חלקי ומלא',
    portal: '/mumedet',
    reg: null as string | null,
    regLabel: null as string | null,
    features: [
      { I: Search,   t: 'חיפוש חכם',     d: 'לפי מחוז, סוג משרה ורמה אקדמית' },
      { I: FileText, t: 'פרופיל מקצועי', d: 'קורות חיים וכישורים במקום אחד'  },
      { I: Star,     t: 'מעקב הגשות',    d: 'סטטוס עדכני לכל בקשה בזמן אמת' },
    ],
  },
  {
    id: 'mosad' as RoleId,
    Icon: School,
    label: 'מוסד',
    tag: 'פורטל מוסדות',
    headline: 'גייסי שליחות חינוך מצוינות',
    sub: 'פרסמי משרות, חפשי שליחות חינוך מצוינות וניהלי את כל תהליך הגיוס',
    portal: '/mosad',
    reg: null as string | null,
    regLabel: null as string | null,
    features: [
      { I: Briefcase, t: 'פרסום משרות',       d: 'הוסיפי ופרסמי ב-2 דקות בדיוק'      },
      { I: Search,    t: 'מאגר שליחות חינוך', d: 'סינון מהיר לפי התמחות ומחוז'        },
      { I: Users,     t: 'ניהול הגשות',        d: 'מסינון ועד ראיון וסגירת גיוס'       },
    ],
  },
  {
    id: 'nehal' as RoleId,
    Icon: ShieldCheck,
    label: 'מנהל מערכת',
    tag: 'פורטל ניהול',
    headline: 'מרכז שליטה לכלל הרשת',
    sub: 'ניהול מוסדות, שליחות חינוך ודוחות KPI על כל תהליכי הגיוס',
    portal: null as string | null,
    reg: '/register/admin',
    regLabel: 'הרשמת מנהל',
    features: [
      { I: Building2, t: 'אישור מוסדות',       d: 'פקחי ואשרי מוסדות חדשים לרשת'     },
      { I: Users,     t: 'ניהול שליחות חינוך', d: 'קודי גישה ומעקב אחר תהליכים'       },
      { I: BarChart2, t: 'דוחות KPI',           d: 'נתוני גיוס, השמה ומגמות לאורך זמן' },
    ],
  },
]

function LoginForm({ role }: { role: typeof ROLES[number] }) {
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [show, setShow]     = useState(false)
  const [err, setErr]       = useState('')
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) { setErr('אימייל או סיסמה שגויים'); setPending(false) }
    else window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink-2)', marginBottom: '5px' }}>אימייל</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required dir="ltr"
          style={{ width: '100%', height: '43px', padding: '0 13px', borderRadius: '10px', border: '1.5px solid var(--line)', fontSize: '14px', outline: 'none', background: 'var(--bg-2)', color: 'var(--ink)', fontFamily: 'inherit', transition: 'all .15s', boxSizing: 'border-box' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)'; e.currentTarget.style.background = '#fff' }}
          onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--line)';   e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--bg-2)' }} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-2)' }}>סיסמה</label>
          <a href="/login" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)', textDecoration: 'none' }}>שכחתי סיסמה</a>
        </div>
        <div style={{ position: 'relative' }}>
          <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
            placeholder="••••••••" required dir="ltr"
            style={{ width: '100%', height: '43px', padding: '0 40px 0 13px', borderRadius: '10px', border: '1.5px solid var(--line)', fontSize: '14px', outline: 'none', background: 'var(--bg-2)', color: 'var(--ink)', fontFamily: 'inherit', transition: 'all .15s', boxSizing: 'border-box' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)'; e.currentTarget.style.background = '#fff' }}
            onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--line)';   e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--bg-2)' }} />
          <button type="button" onClick={() => setShow(v => !v)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 0, display: 'flex' }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {err && (
        <p style={{ margin: 0, padding: '9px 12px', background: 'var(--red-bg)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>{err}</p>
      )}

      <button type="submit" disabled={pending} style={{
        height: '46px', borderRadius: '11px', border: 'none', fontFamily: 'inherit',
        background: pending ? 'var(--ink-4)' : 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)',
        color: 'white', fontWeight: 800, fontSize: '15px', letterSpacing: '-.01em',
        cursor: pending ? 'default' : 'pointer',
        boxShadow: pending ? 'none' : '0 4px 16px rgba(91,58,171,.28)', marginTop: '2px',
      }}>
        {pending ? 'מתחברת...' : 'כניסה למערכת →'}
      </button>

      {role.portal && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', marginTop: '-2px' }}>
          כניסה אישית ישירה:{' '}
          <a href={role.portal} style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>לפורטל האישי ←</a>
        </p>
      )}
      {role.reg && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', marginTop: '-2px' }}>
          טרם נרשמת?{' '}
          <a href={role.reg} style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>{role.regLabel} ←</a>
        </p>
      )}
    </form>
  )
}

export default function Page() {
  const [active, setActive] = useState<RoleId>('mumedet')
  const role = ROLES.find(r => r.id === active)!

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,.95)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                <Image src="/logo-chabad.png" alt="לוגו" width={28} height={28} className="object-contain" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', letterSpacing: '-.01em', lineHeight: 1.1 }}>מערכת גיוס והשמה</div>
                <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>רשת אהלי יוסף יצחק</div>
              </div>
            </div>
            <a href="/login" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,.75)', textDecoration: 'none', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '8px', padding: '6px 14px' }}>
              כניסה ישירה
            </a>
          </div>

          {/* Hero tagline */}
          <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.2, margin: '0 0 8px' }}>
              מחברים בין אנשי חינוך<br />למקומות של שליחות
            </h1>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.75)', fontWeight: 500, margin: 0 }}>
              פלטפורמה דיגיטלית לגיוס מועמדות ומינוי מוסדות ברשת חב&quot;ד
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <a href="/register/candidate"
                style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', borderRadius: '8px', padding: '7px 16px' }}>
                הגשת מועמדות ←
              </a>
              <a href="/dashboard"
                style={{ fontSize: '13px', fontWeight: 700, color: 'var(--purple)', textDecoration: 'none', background: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: '8px', padding: '7px 16px' }}>
                כניסה למערכת ←
              </a>
            </div>
          </div>

          {/* Role tabs */}
          <div style={{ display: 'flex', gap: '6px', paddingBottom: '0' }}>
            {ROLES.map(r => {
              const isActive = r.id === active
              return (
                <button key={r.id} onClick={() => setActive(r.id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    padding: '12px 8px 14px', borderRadius: '14px 14px 0 0', border: 'none',
                    background: isActive ? 'white' : 'rgba(255,255,255,.12)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  <r.Icon size={18} color={isActive ? 'var(--purple)' : 'rgba(255,255,255,.7)'} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: isActive ? 'var(--purple)' : 'rgba(255,255,255,.8)', letterSpacing: '-.01em' }}>{r.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>

        {/* Main card */}
        <div style={{ background: 'white', borderRadius: '0 0 20px 20px', border: '1px solid var(--line)', borderTop: 'none', padding: '24px 24px 22px', boxShadow: '0 8px 32px rgba(91,58,171,.1)', marginBottom: '14px' }}>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--purple-050)', border: '1px solid var(--purple-200)', borderRadius: '999px', padding: '4px 12px', marginBottom: '10px' }}>
              <role.Icon size={12} color="var(--purple)" />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--purple)', letterSpacing: '.04em' }}>{role.tag}</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: '5px' }}>{role.headline}</h1>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', lineHeight: 1.55 }}>{role.sub}</p>
          </div>

          <LoginForm role={role} />
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', paddingBottom: '40px' }}>
          {role.features.map(({ I: Icon, t, d }) => (
            <div key={t} style={{ background: 'white', borderRadius: '14px', padding: '14px 12px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--purple-050)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <Icon size={15} color="var(--purple)" />
              </div>
              <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', marginBottom: '3px' }}>{t}</p>
              <p style={{ fontSize: '11px', color: 'var(--ink-4)', lineHeight: 1.4 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
