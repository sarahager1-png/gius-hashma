'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowLeft, Mail, Lock, ClipboardList, Building2, ShieldCheck } from 'lucide-react'

const ROLES = [
  {
    id: 'candidate',
    label: 'מועמדת',
    sub: 'הרשמה כמועמדת',
    icon: ClipboardList,
    href: '/register/candidate',
    color: '#00BCC8',
    bg: '#DDFAFB',
  },
  {
    id: 'institution',
    label: 'מוסד',
    sub: 'הרשמת מוסד',
    icon: Building2,
    href: '/register/institution',
    color: '#5E3DAE',
    bg: '#F0ECFD',
  },
  {
    id: 'admin',
    label: 'מנהל מערכת',
    sub: 'גישת ניהול',
    icon: ShieldCheck,
    href: '/register/admin',
    color: '#C4831D',
    bg: '#FEF0D9',
  },
]

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent]   = useState(false)

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
      className="min-h-screen flex items-center justify-center px-4 py-12"
      dir="rtl"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(94,61,174,.12) 0%, transparent 60%), var(--bg)',
        fontFamily: 'Heebo, system-ui, sans-serif',
      }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(94,61,174,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,61,174,.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-[400px]">

        {/* Logo above card */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-16 h-16 rounded-[18px] mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #5E3DAE 0%, #00BCC8 100%)',
              boxShadow: '0 8px 32px rgba(94,61,174,.3)',
            }}
          >
            <Image
              src="/logo-chabad.png"
              alt="רשת אהלי יוסף יצחק"
              width={40}
              height={40}
              className="object-contain"
              style={{ filter: 'brightness(10) saturate(0)' }}
            />
          </div>
          <h1
            className="text-[22px] font-extrabold text-center"
            style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}
          >
            מערכת גיוס והשמה
          </h1>
          <p className="text-[13px] mt-1 text-center" style={{ color: 'var(--ink-4)' }}>
            רשת אהלי יוסף יצחק לובאוויטש
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            boxShadow: '0 4px 40px rgba(94,61,174,.10), 0 1px 4px rgba(94,61,174,.06)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[3px] w-full"
            style={{ background: 'linear-gradient(90deg, #5E3DAE 0%, #00BCC8 100%)' }}
          />

          <div className="px-7 py-7">
            {forgotMode ? (
              <>
                <h2
                  className="text-[18px] font-extrabold mb-1"
                  style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}
                >
                  איפוס סיסמה
                </h2>
                <p className="text-[13px] mb-6" style={{ color: 'var(--ink-3)' }}>
                  נשלח קישור איפוס לכתובת האימייל
                </p>

                {resetSent ? (
                  <div className="text-center py-6 space-y-3">
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl"
                      style={{ background: 'var(--green-bg)' }}
                    >
                      ✉️
                    </div>
                    <p className="text-[15px] font-bold" style={{ color: 'var(--green-dark)' }}>
                      קישור נשלח!
                    </p>
                    <p className="text-[12.5px]" style={{ color: 'var(--ink-4)' }}>
                      בדקי גם תיקיית ספאם
                    </p>
                    <button
                      onClick={() => { setForgotMode(false); setResetSent(false) }}
                      className="flex items-center gap-1.5 text-[13px] font-bold mx-auto mt-2 transition-colors"
                      style={{ color: 'var(--purple)' }}
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
                      className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--ink-4)' }}
                    >
                      <ArrowLeft size={13} />
                      חזרה
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2
                  className="text-[18px] font-extrabold mb-1"
                  style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}
                >
                  כניסה למערכת
                </h2>
                <p className="text-[13px] mb-6" style={{ color: 'var(--ink-3)' }}>
                  התחברי כדי להמשיך
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FieldInput
                    id="email" type="email" label="אימייל"
                    icon={<Mail size={15} />}
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password"
                        className="text-[12.5px] font-bold"
                        style={{ color: 'var(--ink-2)' }}
                      >
                        סיסמה
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-[12px] font-semibold transition-colors"
                        style={{ color: 'var(--ink-4)' }}
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
                        className="w-full h-11 rounded-[10px] text-[14px] font-medium"
                        style={{
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
                </form>
              </>
            )}
          </div>

          {/* Join section */}
          {!forgotMode && (
            <>
              <div className="mx-7 mb-5 flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-4)' }}>
                  הצטרפות חדשה
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
              </div>

              <div className="px-7 pb-7 grid grid-cols-3 gap-2.5">
                {ROLES.map(r => {
                  const Icon = r.icon
                  return (
                    <a
                      key={r.id}
                      href={r.href}
                      className="group flex flex-col items-center gap-2 py-3.5 px-1.5 rounded-[14px] text-center no-underline transition-all"
                      style={{ background: r.bg, border: '1.5px solid transparent' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = r.color + '66'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 6px 20px ${r.color}22`
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors"
                        style={{ background: '#fff', color: r.color, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}
                      >
                        <Icon size={17} strokeWidth={2} />
                      </div>
                      <div>
                        <div
                          className="text-[12px] font-bold leading-none"
                          style={{ color: 'var(--ink)' }}
                        >
                          {r.label}
                        </div>
                        <div
                          className="text-[10px] leading-tight mt-0.5"
                          style={{ color: 'var(--ink-4)' }}
                        >
                          {r.sub}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-[11.5px]" style={{ color: 'var(--ink-4)' }}>
          © 2025 רשת חינוך חב״ד · גרסה 1.0
        </p>
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
      <label htmlFor={id} className="block text-[12.5px] font-bold mb-1.5" style={{ color: 'var(--ink-2)' }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none" style={{ color: 'var(--ink-4)' }}>
          {icon}
        </span>
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} required dir="ltr"
          className="w-full h-11 rounded-[10px] text-[14px] font-medium"
          style={{ paddingInlineEnd: '38px', paddingInlineStart: '14px' }}
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
      className="w-full h-11 rounded-[11px] text-[14.5px] font-extrabold text-white transition-all mt-2"
      style={{
        background: 'linear-gradient(135deg, #5E3DAE 0%, #00BCC8 100%)',
        boxShadow: '0 4px 16px rgba(94,61,174,.28)',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {loading ? '...' : children}
    </button>
  )
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[13px] font-semibold text-center py-2 px-3 rounded-[9px]"
      style={{ color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid #FECACA' }}
    >
      {children}
    </p>
  )
}
