'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap, School,
  Search, FileText, Star, Briefcase, Users, KeyRound, Sparkles,
} from 'lucide-react'
import InstallFooter from '@/components/landing/install-footer'

type RoleId = 'mumedet' | 'mosad'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComp = React.FC<any>

const ROLES: {
  id: RoleId; Icon: IconComp; label: string; headline: string; sub: string
  next: string; regLabel: string; hint: string
  features: { I: IconComp; t: string }[]
  brandFeatures: { Icon: IconComp; text: string }[]
}[] = [
  {
    id: 'mumedet',
    Icon: GraduationCap,
    label: 'מועמדת',
    headline: 'מצאי את המשרה המושלמת',
    sub: 'עשרות משרות שליחות חינוך ברשת חב״ד',
    next: '/register/candidate',
    regLabel: 'הגשת מועמדות חדשה ←',
    hint: 'כבר נרשמת? לחצי כאן להיכנס',
    features: [
      { I: Search,   t: 'חיפוש חכם'     },
      { I: FileText, t: 'פרופיל מקצועי' },
      { I: Star,     t: 'מעקב הגשות'    },
    ],
    brandFeatures: [
      { Icon: Search,   text: 'חיפוש חכם מבוסס AI' },
      { Icon: FileText, text: 'פרופיל מקצועי מלא'   },
      { Icon: Star,     text: 'מעקב אחר כל הגשה'   },
    ],
  },
  {
    id: 'mosad',
    Icon: School,
    label: 'מוסד',
    headline: 'גייסי שליחות חינוך מצוינות',
    sub: 'פרסמי משרות וניהלי את תהליך הגיוס',
    next: '/register/institution',
    regLabel: 'הרשמת מוסד חדש ←',
    hint: 'כבר נרשמתם? לחצי כאן להיכנס',
    features: [
      { I: Briefcase, t: 'פרסום משרות'       },
      { I: Search,    t: 'מאגר שליחות חינוך' },
      { I: Users,     t: 'ניהול הגשות'        },
    ],
    brandFeatures: [
      { Icon: Briefcase, text: 'פרסום משרות בקלות'      },
      { Icon: Sparkles,  text: 'התאמה חכמה עם AI'        },
      { Icon: Users,     text: 'ניהול מועמדות וראיונות' },
    ],
  },
]

const STATS = [
  { n: '80+',  label: 'מוסדות'  },
  { n: '300+', label: 'מועמדות' },
  { n: '500+', label: 'תהליכים' },
]

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

function LoginForm({ role }: { role: typeof ROLES[number] }) {
  const [pending, setPending] = useState(false)
  const [err, setErr]         = useState('')

  async function signIn() {
    setPending(true); setErr('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${role.next}` },
    })
    if (error) { setErr('שגיאה בכניסה עם Google. נסי שוב.'); setPending(false) }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={signIn}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2.5 font-bold rounded-[12px] transition-all"
        style={{
          height: '50px',
          fontSize: '14.5px',
          background: pending ? 'var(--bg-2)' : '#fff',
          border: '1.5px solid var(--line)',
          cursor: pending ? 'default' : 'pointer',
          fontFamily: 'inherit',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-xs)',
        }}
        onMouseEnter={e => { if (!pending) { e.currentTarget.style.borderColor = 'var(--purple-200)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)' }}
      >
        {!pending && GOOGLE_SVG}
        <span>{pending ? 'מחברת...' : 'כניסה עם Google'}</span>
      </button>

      {err && (
        <p style={{ margin: 0, padding: '8px 11px', background: 'var(--red-bg)', borderRadius: '8px', fontSize: '12.5px', color: 'var(--red)', fontWeight: 600 }}>
          {err}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        <span style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 700, letterSpacing: '.05em' }}>או</span>
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      </div>

      <a
        href={role.next}
        className="block text-center font-bold rounded-[12px] transition-all"
        style={{
          fontSize: '14.5px',
          color: 'var(--purple)',
          textDecoration: 'none',
          padding: '12px',
          border: '1.5px solid var(--purple-200)',
          background: 'var(--purple-050)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-100)'; e.currentTarget.style.borderColor = 'var(--purple)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--purple-050)'; e.currentTarget.style.borderColor = 'var(--purple-200)' }}
      >
        {role.regLabel}
      </a>

      <p className="text-center" style={{ fontSize: '12.5px', margin: 0 }}>
        <a href="/login" style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          {role.hint}
        </a>
      </p>
    </div>
  )
}

export default function Page() {
  const [active, setActive] = useState<RoleId>('mumedet')
  const role = ROLES.find(r => r.id === active)!

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ fontFamily: 'Heebo, system-ui, sans-serif' }}>

      {/* ══ Sidebar — identical to AppSidebar ══ */}
      <aside
        className="hidden lg:flex flex-col w-[232px] flex-shrink-0 relative overflow-hidden"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        {/* Brand — identical to AppSidebar */}
        <div className="relative z-10 px-4 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-[56px] h-[56px] rounded-[15px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', backdropFilter: 'blur(8px)' }}>
              <Image src="/logo-chabad.png" alt="רשת אהלי יוסף יצחק" width={38} height={38} className="object-contain"
                style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
            </div>
            <div className="min-w-0">
              <div className="font-black leading-tight truncate" style={{ fontSize: '16px', color: '#fff', letterSpacing: '-.025em' }}>
                מערכת גיוס
              </div>
              <div className="font-semibold mt-0.5 truncate" style={{ fontSize: '11px', color: 'rgba(255,255,255,.42)', letterSpacing: '.01em' }}>
                רשת אהלי יוסף יצחק
              </div>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div className="relative z-10 px-3 pt-4 pb-1">
          <p className="text-[9.5px] font-bold tracking-[.16em] uppercase px-2 mb-2.5"
            style={{ color: 'rgba(255,255,255,.25)' }}>
            תכונות עיקריות
          </p>
          <div className="flex flex-col gap-0.5">
            {role.brandFeatures.map(({ Icon: FIcon, text }) => (
              <div key={text}
                className="flex items-center gap-3 px-3 py-[9px] rounded-[10px]"
                style={{ background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.75)', fontSize: '13.5px', fontWeight: 600 }}>
                <span style={{ color: '#00D4E8', display: 'flex', flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(0,167,181,.6))' }}>
                  <FIcon size={16} strokeWidth={2.5} />
                </span>
                <span className="truncate">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 py-4">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 self-start"
            style={{ background: 'rgba(0,167,181,.2)', border: '1px solid rgba(0,167,181,.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00D4E8' }} />
            <span className="font-bold text-white" style={{ fontSize: '10.5px', letterSpacing: '.04em' }}>
              פלטפורמת גיוס חינוכי
            </span>
          </div>
          <h2 className="text-white font-black leading-tight"
            style={{ fontSize: '22px', letterSpacing: '-.04em', lineHeight: 1.15 }}>
            מחברים בין<br />
            <span style={{ color: '#00D4E8' }}>שליחות ומוסדות</span>
          </h2>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 px-3 pb-5 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div className="grid grid-cols-3 gap-1">
            {STATS.map(s => (
              <div key={s.label} className="text-center py-2.5 rounded-[10px]"
                style={{ background: 'rgba(255,255,255,.06)' }}>
                <div className="font-black text-white" style={{ fontSize: '15px', letterSpacing: '-.02em' }}>{s.n}</div>
                <div className="font-medium" style={{ fontSize: '9.5px', color: 'rgba(255,255,255,.38)', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[9.5px] font-semibold text-center mt-3" style={{ color: 'rgba(255,255,255,.2)' }}>
            מערכת עלייה · תשפ״ו–תשפ״ז
          </div>
        </div>
      </aside>

      {/* ══ Main area — dashboard bg ══ */}
      <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-2)', minWidth: 0 }}>

        {/* Desktop header bar */}
        <div className="hidden lg:flex items-center justify-between px-6 shrink-0"
          style={{ height: '64px', background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)', boxShadow: 'var(--shadow-xs)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-bold uppercase tracking-[.1em]" style={{ color: 'var(--purple)' }}>
              כניסה למערכת
            </span>
          </div>
          <a href="/nehal"
            className="flex items-center gap-1.5 rounded-[8px] transition-all"
            style={{ fontSize: '12px', fontWeight: 700, padding: '6px 12px', color: 'var(--ink-4)', background: 'var(--bg-3)', border: '1px solid var(--line)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-050)'; e.currentTarget.style.color = 'var(--purple)'; e.currentTarget.style.borderColor = 'var(--purple-200)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--ink-4)'; e.currentTarget.style.borderColor = 'var(--line)' }}
          >
            <KeyRound size={12} />
            הנהלה
          </a>
        </div>

        {/* Mobile hero banner — gradient with large logo */}
        <div className="lg:hidden relative overflow-hidden shrink-0"
          style={{ background: 'var(--sidebar-bg)', padding: '28px 20px 32px' }}>
          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          {/* Glow blob */}
          <div className="absolute pointer-events-none"
            style={{ top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,167,181,.25) 0%, transparent 65%)' }} />
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Logo */}
            <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mb-3 shrink-0"
              style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 28px rgba(0,0,0,.25)' }}>
              <Image src="/logo-chabad.png" alt="רשת אהלי יוסף יצחק" width={48} height={48} className="object-contain"
                style={{ filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
            </div>
            <div className="font-black text-white mb-0.5" style={{ fontSize: '20px', letterSpacing: '-.025em' }}>
              מערכת גיוס והשמה
            </div>
            <div className="font-medium" style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)' }}>
              רשת אהלי יוסף יצחק לובאוויטש
            </div>
          </div>
          {/* Admin link — bottom left of banner */}
          <a href="/nehal"
            className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-[8px] transition-all"
            style={{ fontSize: '11.5px', fontWeight: 700, padding: '5px 10px', color: 'rgba(255,255,255,.5)', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}
          >
            <KeyRound size={11} />
            הנהלה
          </a>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-auto">
          <div className="w-full max-w-[400px]">

            {/* Page heading — like dashboard page headers */}
            <div className="mb-5">
              <p className="text-[11.5px] font-bold uppercase tracking-[.1em] mb-1.5"
                style={{ color: 'var(--purple)' }}>
                רשת חינוך חב״ד
              </p>
              <h1 className="font-black leading-tight mb-1.5"
                style={{ fontSize: '28px', color: 'var(--ink)', letterSpacing: '-.03em', lineHeight: 1.2 }}>
                {role.headline}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)', lineHeight: 1.5 }}>{role.sub}</p>
            </div>

            {/* Card — matches dashboard cards */}
            <div className="rounded-[16px] overflow-hidden"
              style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>

              {/* Role tabs */}
              <div className="p-4 pb-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <div className="flex gap-1 p-1 rounded-[12px]"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                  {ROLES.map(r => {
                    const isActive = r.id === active
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActive(r.id)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-[9px] font-bold transition-all"
                        style={{
                          padding: '10px 8px',
                          fontSize: '14px',
                          background: isActive ? '#fff' : 'transparent',
                          color: isActive ? 'var(--purple)' : 'var(--ink-3)',
                          boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <r.Icon size={16} strokeWidth={2} />
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Form body */}
              <div className="p-4">
                <LoginForm role={role} />
              </div>
            </div>

            {/* Feature chips */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {role.features.map(({ I: Icon, t }) => (
                <div key={t}
                  className="flex flex-col items-center gap-1.5 rounded-[10px] py-3 px-2"
                  style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-xs)' }}>
                  <div className="w-7 h-7 flex items-center justify-center rounded-[7px]"
                    style={{ background: 'var(--purple-050)' }}>
                    <Icon size={13} color="var(--purple)" />
                  </div>
                  <span className="font-bold text-center" style={{ fontSize: '11px', color: 'var(--ink)', lineHeight: 1.3 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <InstallFooter />
      </div>
    </div>
  )
}
