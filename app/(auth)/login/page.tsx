'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock,
  ClipboardList, Building2, KeyRound, CheckCircle2,
} from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent]   = useState(false)
  const [activeRole, setActiveRole] = useState<'candidate' | 'institution'>('candidate')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('אימייל או סיסמה שגויים')
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ fontFamily: 'Heebo, system-ui, sans-serif' }}
    >
      {/* ══ Brand panel — RTL: right / start side (desktop only) ══ */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2D1B5E 0%, #0E3050 55%, #0a2540 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-110px', right: '-110px',
            width: '520px', height: '520px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,167,181,.2) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-70px', left: '-70px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(75,46,131,.35) 0%, transparent 65%)',
          }}
        />

        <div />

        {/* Center content */}
        <div className="flex flex-col items-center text-center px-10 relative z-10">
          {/* Logo */}
          <div
            className="w-[88px] h-[88px] rounded-[26px] mb-7 flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.18)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Image
              src="/logo-chabad.png"
              alt="רשת אהלי יוסף יצחק"
              width={54}
              height={54}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
          </div>

          <h2
            className="text-white font-black mb-2"
            style={{ fontSize: '28px', letterSpacing: '-.03em', lineHeight: 1.15 }}
          >
            מערכת גיוס והשמה
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', marginBottom: '6px' }}>
            רשת אהלי יוסף יצחק לובאוויטש
          </p>

          <div
            className="my-7 w-14 h-px"
            style={{ background: 'rgba(255,255,255,.18)' }}
          />

          {/* Features */}
          <div className="space-y-3 w-full max-w-[260px]">
            {[
              { icon: '🏫', text: 'ניהול משרות ומועמדות' },
              { icon: '🤖', text: 'התאמה חכמה מבוססת AI' },
              { icon: '📊', text: 'ניתוח נתונים ודוחות' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.1)', fontSize: '16px' }}
                >
                  {icon}
                </div>
                <span
                  className="font-medium"
                  style={{ fontSize: '14px', color: 'rgba(255,255,255,.72)' }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="text-center pb-6"
          style={{ fontSize: '11px', color: 'rgba(255,255,255,.2)' }}
        >
          פלטפורמת גיוס חינוכי
        </div>
      </div>

      {/* ══ Form panel — RTL: left / end side ══ */}
      <div className="flex-1 flex flex-col bg-white relative overflow-hidden">

        {/* Subtle radial tint */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(94,61,174,.07) 0%, transparent 60%)',
          }}
        />

        {/* Admin key */}
        <div className="absolute top-4 left-5 z-10">
          <a
            href="/register/admin"
            className="flex items-center gap-1.5 rounded-lg transition-all"
            style={{
              fontSize: '12px', fontWeight: 700,
              padding: '6px 12px',
              color: 'var(--ink-4)',
              background: 'rgba(94,61,174,.07)',
              border: '1px solid rgba(94,61,174,.1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(94,61,174,.14)'
              e.currentTarget.style.color = 'var(--purple)'
              e.currentTarget.style.borderColor = 'rgba(94,61,174,.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(94,61,174,.07)'
              e.currentTarget.style.color = 'var(--ink-4)'
              e.currentTarget.style.borderColor = 'rgba(94,61,174,.1)'
            }}
          >
            <KeyRound size={12} />
            הנהלה
          </a>
        </div>

        {/* Mobile-only logo */}
        <div className="lg:hidden flex flex-col items-center pt-14 pb-2">
          <div
            className="w-14 h-14 rounded-[16px] mb-3 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #5E3DAE 0%, #00BCC8 100%)',
              boxShadow: '0 6px 24px rgba(94,61,174,.28)',
            }}
          >
            <Image
              src="/logo-chabad.png"
              alt="רשת"
              width={34}
              height={34}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div
            className="text-[17px] font-extrabold"
            style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}
          >
            מערכת גיוס והשמה
          </div>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px] relative z-10">

            {/* Heading */}
            <div className="mb-7">
              <h1
                className="font-black leading-tight mb-1.5"
                style={{
                  fontSize: '26px',
                  color: 'var(--ink)',
                  letterSpacing: '-.03em',
                }}
              >
                {forgotMode ? 'שחזור סיסמה' : 'ברוכה הבאה,'}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)' }}>
                {forgotMode
                  ? 'נשלח קישור לאיפוס הסיסמה לאימייל שלך'
                  : 'היכנסי למערכת הגיוס של רשת חב"ד'}
              </p>
            </div>

            {/* Role selector */}
            {!forgotMode && (
              <div
                className="flex gap-1 p-1 rounded-[14px] mb-6"
                style={{ background: 'rgba(94,61,174,.07)' }}
              >
                {([
                  { id: 'candidate' as const,    label: 'מועמדת', icon: ClipboardList },
                  { id: 'institution' as const,  label: 'מוסד',   icon: Building2 },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveRole(id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-[10px] font-bold transition-all"
                    style={{
                      padding: '10px 8px',
                      fontSize: '14px',
                      background: activeRole === id ? '#fff' : 'transparent',
                      color: activeRole === id ? 'var(--purple)' : 'var(--ink-3)',
                      boxShadow: activeRole === id ? '0 2px 8px rgba(94,61,174,.12)' : 'none',
                    }}
                  >
                    <Icon size={15} strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Forgot-password flow ── */}
            {forgotMode ? (
              resetSent ? (
                <div className="text-center py-8 space-y-4">
                  <div
                    className="w-16 h-16 rounded-[20px] mx-auto flex items-center justify-center"
                    style={{ background: '#DCFCE7' }}
                  >
                    <CheckCircle2 size={32} color="#16A34A" />
                  </div>
                  <div>
                    <p className="font-bold mb-1" style={{ fontSize: '16px', color: '#15803D' }}>
                      קישור נשלח!
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--ink-4)' }}>
                      בדקי גם בתיקיית ספאם
                    </p>
                  </div>
                  <button
                    onClick={() => { setForgotMode(false); setResetSent(false) }}
                    className="flex items-center gap-1.5 font-bold mx-auto transition-colors"
                    style={{ fontSize: '13px', color: 'var(--purple)' }}
                  >
                    <ArrowLeft size={14} />
                    חזרה לכניסה
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <FieldInput
                    id="reset-email" type="email" label="אימייל"
                    icon={<Mail size={15} />}
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  {error && <ErrMsg>{error}</ErrMsg>}
                  <SubmitBtn loading={loading}>שלחי קישור איפוס</SubmitBtn>
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="w-full flex items-center justify-center gap-1.5 font-medium transition-colors"
                    style={{ fontSize: '13px', color: 'var(--ink-4)' }}
                  >
                    <ArrowLeft size={13} />
                    חזרה
                  </button>
                </form>
              )
            ) : (
              /* ── Login form ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <FieldInput
                  id="email" type="email" label="אימייל"
                  icon={<Mail size={15} />}
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />

                {/* Password field with forgot link */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="font-bold"
                      style={{ fontSize: '12.5px', color: 'var(--ink-2)' }}
                    >
                      סיסמה
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="font-semibold transition-colors"
                      style={{ fontSize: '12px', color: 'var(--ink-4)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--purple)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-4)'}
                    >
                      שכחתי סיסמה
                    </button>
                  </div>
                  <div className="relative">
                    <span
                      className="absolute inset-y-0 end-3 flex items-center pointer-events-none"
                      style={{ color: 'var(--ink-4)' }}
                    >
                      <Lock size={15} />
                    </span>
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full h-11 rounded-[10px] font-medium"
                      style={{
                        fontSize: '14px',
                        paddingInlineStart: '40px',
                        paddingInlineEnd: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute inset-y-0 start-3 flex items-center transition-colors"
                      style={{ color: 'var(--ink-4)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--purple)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-4)'}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && <ErrMsg>{error}</ErrMsg>}
                <SubmitBtn loading={loading}>כניסה למערכת</SubmitBtn>

                {/* Registration link */}
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                    <span
                      className="font-semibold uppercase tracking-widest"
                      style={{ fontSize: '11px', color: 'var(--ink-4)' }}
                    >
                      הצטרפות חדשה
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                  </div>
                  <a
                    href={activeRole === 'candidate' ? '/register/candidate' : '/register/institution'}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-[11px] font-bold transition-all"
                    style={{
                      fontSize: '14px',
                      border: '1.5px solid var(--line)',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--purple)'
                      e.currentTarget.style.color = 'var(--purple)'
                      e.currentTarget.style.background = 'rgba(94,61,174,.04)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--line)'
                      e.currentTarget.style.color = 'var(--ink)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {activeRole === 'candidate'
                      ? <><ClipboardList size={15} /> הרשמה כמועמדת</>
                      : <><Building2 size={15} /> הרשמת מוסד</>}
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center pb-5"
          style={{ fontSize: '11.5px', color: 'var(--ink-4)' }}
        >
          © 2026 רשת חינוך חב״ד · גרסה 1.0
        </div>
      </div>

    </div>
  )
}

/* ── Helpers ── */
function FieldInput({
  id, type, label, icon, value, onChange, placeholder,
}: {
  id: string; type: string; label: string
  icon: React.ReactNode
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-bold mb-1.5"
        style={{ fontSize: '12.5px', color: 'var(--ink-2)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute inset-y-0 end-3 flex items-center pointer-events-none"
          style={{ color: 'var(--ink-4)' }}
        >
          {icon}
        </span>
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} required dir="ltr"
          className="w-full h-11 rounded-[10px] font-medium"
          style={{
            fontSize: '14px',
            paddingInlineEnd: '38px',
            paddingInlineStart: '14px',
          }}
        />
      </div>
    </div>
  )
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-11 rounded-[11px] font-extrabold text-white transition-all mt-2"
      style={{
        fontSize: '14.5px',
        background: 'linear-gradient(135deg, #5E3DAE 0%, #00BCC8 100%)',
        boxShadow: '0 4px 16px rgba(94,61,174,.28)',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {loading ? '...' : children}
    </button>
  )
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-semibold text-center py-2 px-3 rounded-[9px]"
      style={{
        fontSize: '13px',
        color: 'var(--red)',
        background: 'var(--red-bg)',
        border: '1px solid #FECACA',
      }}
    >
      {children}
    </p>
  )
}
