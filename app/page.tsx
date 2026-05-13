'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, School, Search, FileText, Star, Briefcase, Users, KeyRound } from 'lucide-react'
import InstallFooter from '@/components/landing/install-footer'

type RoleId = 'mumedet' | 'mosad'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComp = React.FC<any>

const ROLES: {
  id: RoleId; Icon: IconComp; label: string; headline: string; sub: string
  next: string; regLabel: string; hint: string
  features: { I: IconComp; t: string }[]
  heroFeatures: { icon: string; text: string }[]
}[] = [
  {
    id: 'mumedet',
    Icon: GraduationCap,
    label: 'מועמדת',
    headline: 'מצאי את המשרה המושלמת',
    sub: 'עשרות משרות שליחות חינוך ברשת חב״ד — חיפוש חכם, פרופיל מקצועי, ומעקב הגשות',
    next: '/register/candidate',
    regLabel: 'הגשת מועמדות חדשה ←',
    hint: 'כבר נרשמת? לחצי כאן להיכנס',
    features: [
      { I: Search,   t: 'חיפוש חכם'     },
      { I: FileText, t: 'פרופיל מקצועי' },
      { I: Star,     t: 'מעקב הגשות'    },
    ],
    heroFeatures: [
      { icon: '✦', text: 'חיפוש חכם מבוסס AI' },
      { icon: '◈', text: 'פרופיל מקצועי מלא' },
      { icon: '❋', text: 'מעקב אחר כל הגשה' },
    ],
  },
  {
    id: 'mosad',
    Icon: School,
    label: 'מוסד',
    headline: 'גייסי שליחות חינוך מצוינות',
    sub: 'פרסמי משרות, מצאי מועמדות מותאמות וניהלי את תהליך הגיוס — הכל במקום אחד',
    next: '/register/institution',
    regLabel: 'הרשמת מוסד חדש ←',
    hint: 'כבר נרשמתם? לחצי כאן להיכנס',
    features: [
      { I: Briefcase, t: 'פרסום משרות'       },
      { I: Search,    t: 'מאגר שליחות חינוך' },
      { I: Users,     t: 'ניהול הגשות'        },
    ],
    heroFeatures: [
      { icon: '✦', text: 'פרסום משרות בקלות' },
      { icon: '◈', text: 'התאמה חכמה עם AI' },
      { icon: '❋', text: 'ניהול מועמדות וראיונות' },
    ],
  },
]

const STATS = [
  { n: '80+',  label: 'מוסדות'  },
  { n: '300+', label: 'מועמדות' },
  { n: '500+', label: 'תהליכים' },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function LoginForm({ role, pending, onSignIn, err }: {
  role: typeof ROLES[number]
  pending: boolean
  onSignIn: () => void
  err: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onSignIn}
        disabled={pending}
        className="form-google-btn"
      >
        {pending ? (
          <span>מחברת...</span>
        ) : (
          <>
            <div className="btn-icon"><GoogleIcon /></div>
            <span>כניסה עם Google</span>
          </>
        )}
      </button>

      {err && <div className="form-error">{err}</div>}

      <div className="form-divider">
        <div className="form-divider-line" />
        <span className="form-divider-text">או</span>
        <div className="form-divider-line" />
      </div>

      <a
        href={role.next}
        className="form-reg-btn"
      >
        {role.regLabel}
      </a>

      <p className="text-center" style={{ fontSize: '12.5px', margin: 0, color: 'rgba(107,102,136,.55)' }}>
        <a href="/login" style={{ color: '#4B2E83', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          {role.hint}
        </a>
      </p>
    </div>
  )
}

export default function Page() {
  const [active, setActive] = useState<RoleId>('mumedet')
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const role = ROLES.find(r => r.id === active)!

  async function signIn() {
    setPending(true); setErr('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setErr('שגיאה בכניסה עם Google. נסי שוב.'); setPending(false) }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(-2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.32; }
        }

        .landing-root {
          height: 100vh;
          display: flex;
          direction: rtl;
          font-family: 'Heebo', system-ui, sans-serif;
          background: #FAF9FC;
          overflow: hidden;
        }

        /* ── Hero panel (right, 40%) ── */
        .hero-panel {
          width: 40%;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #1A0D38;
          height: 100vh;
        }
        @media (max-width: 1023px) { .hero-panel { display: none; } }

        .hero-grad-base {
          position: absolute; inset: 0;
          background: linear-gradient(160deg,
            #0D0820 0%, #1E1040 25%, #2A1558 50%, #1A0D38 75%, #120828 100%
          );
        }
        .hero-grad-purple {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 120% 80% at 50% -10%,
            rgba(91,63,163,.55) 0%, transparent 65%
          );
          animation: pulse-glow 5s ease-in-out infinite;
        }
        .hero-grad-gold {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 40% at 80% 85%,
            rgba(212,176,106,.18) 0%, transparent 60%
          );
        }
        .hero-grad-left {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 55% 45% at -10% 40%,
            rgba(67,40,116,.35) 0%, transparent 65%
          );
        }

        .hero-pattern {
          position: absolute; inset: 0;
          opacity: 0.055;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpolygon points='40,8 46.9,24.6 65,21 54.5,35.8 65,50.6 46.9,47 40,63.6 33.1,47 15,50.6 25.5,35.8 15,21 33.1,24.6' fill='none' stroke='white' stroke-width='0.8'/%3E%3Ccircle cx='40' cy='36' r='7' fill='none' stroke='white' stroke-width='0.6'/%3E%3C/svg%3E");
          background-size: 80px 80px;
        }
        .hero-grid {
          position: absolute; inset: 0;
          opacity: 0.04;
          background-image:
            linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .hero-orb-1 {
          position: absolute;
          top: 12%; right: -8%;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91,63,163,.28) 0%, transparent 70%);
          animation: float1 9s ease-in-out infinite;
        }
        .hero-orb-2 {
          position: absolute;
          bottom: 15%; left: -12%;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.15) 0%, transparent 70%);
          animation: float2 11s ease-in-out infinite;
        }
        .hero-orb-3 {
          position: absolute;
          top: 52%; right: 30%;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91,63,163,.22) 0%, transparent 70%);
          animation: float1 13s ease-in-out infinite reverse;
        }

        .hero-menorah-arc {
          position: absolute;
          bottom: -40px; left: 50%;
          transform: translateX(-50%);
          width: 500px; height: 250px;
          border-radius: 250px 250px 0 0;
          border: 1px solid rgba(212,176,106,.12);
          border-bottom: none;
        }
        .hero-menorah-arc-2 {
          position: absolute;
          bottom: -40px; left: 50%;
          transform: translateX(-50%);
          width: 340px; height: 170px;
          border-radius: 170px 170px 0 0;
          border: 1px solid rgba(212,176,106,.08);
          border-bottom: none;
        }
        .hero-gold-line {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 1px; height: 100%;
          background: linear-gradient(180deg,
            transparent 0%, rgba(212,176,106,.15) 30%,
            rgba(212,176,106,.22) 50%, rgba(212,176,106,.08) 75%, transparent 100%
          );
        }

        .hero-content {
          position: relative; z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(24px, 4vh, 60px) clamp(24px, 4vw, 48px);
          text-align: center;
          overflow-y: auto;
          min-height: 0;
        }

        .hero-logo-wrap { position: relative; margin-bottom: 40px; }
        .hero-logo-halo {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 140px; height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.25) 0%, transparent 70%);
        }
        .hero-logo-img {
          position: relative; z-index: 1;
          width: 72px; height: 72px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.92;
        }

        .hero-gold-divider {
          width: 40px; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,176,106,.7), transparent);
          margin: 0 auto 10px;
        }
        .hero-name-badge {
          font-size: 18px; font-weight: 800;
          letter-spacing: -0.01em;
          color: rgba(255,255,255,.92);
          margin-bottom: 6px;
          text-shadow: 0 2px 12px rgba(0,0,0,.4);
        }
        .hero-name-sub {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(212,176,106,.65);
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .hero-headline {
          font-size: 32px; font-weight: 900;
          color: #ffffff;
          line-height: 1.18; letter-spacing: -0.03em;
          margin-bottom: 16px;
          text-shadow: 0 2px 20px rgba(0,0,0,.4);
          transition: opacity 200ms;
        }
        .hero-headline em {
          font-style: normal;
          background: linear-gradient(90deg, #D4B06A 0%, #F0D08A 50%, #D4B06A 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .hero-sub {
          font-size: 13.5px; font-weight: 400;
          color: rgba(255,255,255,.48);
          line-height: 1.7;
          max-width: 240px;
          margin: 0 auto 40px;
          transition: opacity 200ms;
        }

        .hero-features {
          display: flex; flex-direction: column; gap: 10px;
          width: 100%; max-width: 270px;
          margin: 0 auto;
        }
        .hero-feature-row {
          display: flex; align-items: center; gap: 14px;
          padding: 11px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          backdrop-filter: blur(8px);
          transition: background 200ms;
        }
        .hero-feature-row:hover { background: rgba(255,255,255,.07); }
        .hero-feature-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 15px;
          background: rgba(212,176,106,.12);
          border: 1px solid rgba(212,176,106,.18);
        }
        .hero-feature-text {
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,.65);
          text-align: right; flex: 1;
        }

        .hero-footer {
          position: relative; z-index: 10;
          text-align: center;
          padding: 0 0 24px;
          font-size: 11px;
          color: rgba(255,255,255,.18);
          letter-spacing: 0.04em;
        }

        /* ── Form panel (left, 60%) ── */
        .form-panel {
          flex: 1;
          display: flex; flex-direction: column;
          position: relative; overflow-y: auto;
          background: #FAF9FC;
          height: 100vh;
        }

        .form-panel-grad-1 {
          position: absolute;
          top: -120px; right: -120px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91,63,163,.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .form-panel-grad-2 {
          position: absolute;
          bottom: -80px; left: -80px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,176,106,.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .form-panel-dots {
          position: absolute; inset: 0;
          opacity: 0.025;
          background-image: radial-gradient(circle, #432874 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .form-topbar {
          position: absolute;
          top: 20px; left: 24px;
          z-index: 10;
        }
        .form-admin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 12px; font-weight: 600;
          color: rgba(67,40,116,.55);
          background: rgba(67,40,116,.06);
          border: 1px solid rgba(67,40,116,.1);
          text-decoration: none;
          transition: all 200ms;
          font-family: 'Heebo', system-ui, sans-serif;
        }
        .form-admin-btn:hover {
          background: rgba(67,40,116,.12);
          color: #432874;
          border-color: rgba(67,40,116,.22);
        }

        /* Mobile brand strip */
        .mobile-brand {
          display: none;
          flex-direction: column;
          align-items: center;
          padding: 52px 24px 20px;
          text-align: center;
          position: relative; z-index: 1;
        }
        @media (max-width: 1023px) { .mobile-brand { display: flex; } }
        .mobile-logo-ring {
          width: 68px; height: 68px;
          border-radius: 20px;
          background: linear-gradient(135deg, #432874 0%, #5B3FA3 100%);
          box-shadow: 0 8px 28px rgba(67,40,116,.32);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }

        .form-main {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: clamp(16px, 3vh, 40px) 24px;
          position: relative; z-index: 1;
          min-height: 0;
        }
        .form-card { width: 100%; max-width: 420px; }

        .form-welcome {
          margin-bottom: 28px;
          animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .form-welcome-eyebrow {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 10px;
        }
        .form-welcome-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: linear-gradient(135deg, #D4B06A, #F0D08A);
          flex-shrink: 0;
        }
        .form-welcome-eyebrow-text {
          font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(67,40,116,.5);
          text-transform: uppercase;
        }
        .form-heading {
          font-size: 28px; font-weight: 900;
          color: #1A0D38; line-height: 1.18;
          letter-spacing: -0.03em; margin-bottom: 8px;
          transition: opacity 150ms;
        }
        .form-sub {
          font-size: 13.5px; color: #6B6688;
          line-height: 1.65; font-weight: 400;
          transition: opacity 150ms;
        }

        /* Role tabs */
        .role-tabs-wrap {
          margin-bottom: 24px;
          animation: fadeIn 0.4s 0.05s both;
        }
        .role-tabs-inner {
          display: flex; gap: 4px;
          padding: 4px;
          border-radius: 14px;
          background: rgba(75,46,131,.06);
          border: 1.5px solid rgba(75,46,131,.1);
        }
        .role-tab {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 11px 8px;
          border-radius: 11px;
          font-size: 14px; font-weight: 700;
          border: none; cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
          font-family: 'Heebo', system-ui, sans-serif;
        }
        .role-tab-active {
          background: #fff;
          color: #4B2E83;
          box-shadow: 0 2px 12px rgba(75,46,131,.18), 0 1px 3px rgba(75,46,131,.1);
        }
        .role-tab-inactive {
          background: transparent;
          color: rgba(107,102,136,.65);
        }
        .role-tab-inactive:hover { background: rgba(255,255,255,.5); color: #4B2E83; }

        /* Google button */
        .form-google-btn {
          position: relative; width: 100%; height: 54px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-family: 'Heebo', system-ui, sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          transition: all 260ms cubic-bezier(0.16,1,0.3,1);
          border: none; outline: none;
          animation: fadeUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both;
          overflow: hidden;
        }
        .form-google-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #432874 0%, #5B3FA3 60%, #432874 100%);
          background-size: 200% 100%;
          transition: background-position 400ms ease;
        }
        .form-google-btn:hover::before { background-position: 100% 0; }
        .form-google-btn::after {
          content: '';
          position: absolute; inset: 0;
          box-shadow: 0 8px 32px rgba(67,40,116,.38), 0 2px 8px rgba(67,40,116,.22);
          border-radius: 16px;
          transition: opacity 260ms;
        }
        .form-google-btn:hover::after {
          box-shadow: 0 12px 40px rgba(67,40,116,.52), 0 4px 12px rgba(67,40,116,.3);
        }
        .form-google-btn:active { transform: scale(0.985); }
        .form-google-btn:disabled { opacity: 0.68; cursor: not-allowed; transform: none; }
        .form-google-btn span { position: relative; z-index: 1; color: #fff; }
        .btn-icon {
          position: relative; z-index: 1;
          background: rgba(255,255,255,.12);
          border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .form-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 20px 0;
          animation: fadeIn 0.5s 0.25s both;
        }
        .form-divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(67,40,116,.12), transparent);
        }
        .form-divider-text {
          font-size: 11.5px; font-weight: 600;
          color: rgba(107,102,136,.5);
          letter-spacing: 0.06em;
        }

        .form-reg-btn {
          display: block; text-align: center; text-decoration: none;
          font-size: 14.5px; font-weight: 700;
          color: #4B2E83;
          padding: 13px;
          border-radius: 14px;
          border: 1.5px solid rgba(75,46,131,.2);
          background: rgba(75,46,131,.05);
          transition: all 200ms;
          font-family: 'Heebo', system-ui, sans-serif;
          animation: fadeUp 0.5s 0.2s both;
        }
        .form-reg-btn:hover {
          background: rgba(75,46,131,.1);
          border-color: rgba(75,46,131,.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(75,46,131,.12);
        }

        .form-error {
          margin-top: 10px; padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px; font-weight: 600;
          color: #C83B3B; background: #FEE8E8;
          border: 1px solid #FECACA;
          text-align: center;
          animation: fadeUp 0.3s ease both;
        }

        .hero-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 6px; margin-top: 32px;
        }
        .hero-stat {
          text-align: center; padding: 12px 8px;
          border-radius: 12px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.07);
        }
        .hero-stat-n {
          font-size: 18px; font-weight: 900;
          color: #fff; letter-spacing: -0.025em;
        }
        .hero-stat-l {
          font-size: 9.5px; font-weight: 600;
          color: rgba(255,255,255,.35);
          margin-top: 1px;
        }

        .form-footer {
          position: relative; z-index: 1;
          text-align: center;
          padding: 0 0 20px;
          font-size: 11.5px;
          color: rgba(107,102,136,.4);
        }
      `}</style>

      <div className="landing-root">

        {/* ══ Hero Panel ══ */}
        <div className="hero-panel">
          <div className="hero-grad-base" />
          <div className="hero-grad-purple" />
          <div className="hero-grad-gold" />
          <div className="hero-grad-left" />
          <div className="hero-pattern" />
          <div className="hero-grid" />
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
          <div className="hero-orb-3" />
          <div className="hero-menorah-arc" />
          <div className="hero-menorah-arc-2" />
          <div className="hero-gold-line" />

          <div className="hero-content" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 800ms ease' }}>

            <div className="hero-logo-wrap">
              <div className="hero-logo-halo" />
              <Image
                src="/logo-chabad.png"
                alt="רשת אהלי יוסף יצחק"
                width={72} height={72}
                className="hero-logo-img"
              />
            </div>

            <div className="hero-gold-divider" />
            <div className="hero-name-badge">עתודות לשליחות</div>
            <div className="hero-name-sub">רשת אהלי יוסף יצחק</div>

            <h1 className="hero-headline">
              {active === 'mumedet' ? (
                <><em>מצאי שליחות</em><br />שתשנה<br />את חייך</>
              ) : (
                <>גייסי<br /><em>שליחות חינוך</em><br />מצוינות</>
              )}
            </h1>

            <p className="hero-sub">
              {active === 'mumedet'
                ? 'מערכת גיוס חינוכי חכמה — שליחות, צמיחה וליווי אישי לאורך כל הדרך'
                : 'פרסמי משרות, מצאי מועמדות מתאימות וניהלי את כל תהליך הגיוס במקום אחד'}
            </p>

            <div className="hero-features">
              {role.heroFeatures.map(({ icon, text }) => (
                <div key={text} className="hero-feature-row">
                  <div className="hero-feature-icon">{icon}</div>
                  <span className="hero-feature-text">{text}</span>
                </div>
              ))}
            </div>

            <div className="hero-stats">
              {STATS.map(s => (
                <div key={s.label} className="hero-stat">
                  <div className="hero-stat-n">{s.n}</div>
                  <div className="hero-stat-l">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-footer">
            כל הזכויות שמורות לרשת חינוך חב&quot;ד &nbsp;·&nbsp; שרה הגר 050-333-9770
          </div>
        </div>

        {/* ══ Form Panel ══ */}
        <div className="form-panel">
          <div className="form-panel-grad-1" />
          <div className="form-panel-grad-2" />
          <div className="form-panel-dots" />

          <div className="form-topbar">
            <a href="/nehal" className="form-admin-btn">
              <KeyRound size={12} />
              הנהלה
            </a>
          </div>

          {/* Mobile brand strip */}
          <div className="mobile-brand">
            <div className="mobile-logo-ring">
              <Image
                src="/logo-chabad.png"
                alt="עתודות לשליחות"
                width={38} height={38}
                style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1A0D38', letterSpacing: '-0.025em', marginBottom: '4px' }}>
              עתודות לשליחות
            </div>
            <div style={{ fontSize: '13px', color: '#6B6688' }}>
              רשת אהלי יוסף יצחק לובאוויטש
            </div>
          </div>

          <div className="form-main">
            <div className="form-card" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 600ms 100ms ease' }}>

              {/* Welcome heading */}
              <div className="form-welcome">
                <div className="form-welcome-eyebrow">
                  <div className="form-welcome-dot" />
                  <span className="form-welcome-eyebrow-text">כניסה למערכת</span>
                </div>
                <h1 className="form-heading">{role.headline}</h1>
                <p className="form-sub">{role.sub}</p>
              </div>

              {/* Role tabs */}
              <div className="role-tabs-wrap">
                <div className="role-tabs-inner">
                  {ROLES.map(r => {
                    const isActive = r.id === active
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setActive(r.id); setErr('') }}
                        className={`role-tab ${isActive ? 'role-tab-active' : 'role-tab-inactive'}`}
                      >
                        <r.Icon size={16} strokeWidth={2} />
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Login form */}
              <LoginForm
                role={role}
                pending={pending}
                onSignIn={signIn}
                err={err}
              />
            </div>
          </div>

          <InstallFooter />
        </div>
      </div>
    </>
  )
}
