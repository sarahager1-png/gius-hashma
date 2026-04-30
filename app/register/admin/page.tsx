'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function RegisterAdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'שגיאה בהרשמה')
      setLoading(false)
      return
    }

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'מנהל רשת', full_name: form.full_name, phone: form.phone }),
    })

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה ביצירת פרופיל')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      dir="rtl"
      style={{ background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-[400px]">
        <div className="rounded-[24px] overflow-hidden" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.13)', border: '1px solid var(--line)' }}>
          <div className="h-[5px]" style={{ background: 'linear-gradient(90deg, var(--purple-800), var(--purple), var(--teal))' }} />

          {/* Logo */}
          <div className="flex flex-col items-center pt-7 pb-5 px-8">
            <div className="w-14 h-14 rounded-[16px] mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', boxShadow: '0 4px 16px rgba(91,58,171,.25)' }}>
              <Image src="/logo-chabad.png" alt="רשת אהלי יוסף יצחק" width={36} height={36} className="object-contain brightness-[10]" />
            </div>
            <div className="text-[11px] font-semibold tracking-wide text-center mb-0.5" style={{ color: 'var(--ink-4)', letterSpacing: '.04em' }}>
              רשת אהלי יוסף יצחק לובאוויטש
            </div>
            <div className="text-[17px] font-extrabold text-center" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
              הרשמה כמנהל מערכת
            </div>
          </div>

          <div className="mx-8 h-px" style={{ background: 'var(--line)' }} />

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'full_name', label: 'שם מלא', type: 'text', dir: 'rtl' as const },
                { key: 'phone',    label: 'טלפון',  type: 'tel',  dir: 'ltr' as const },
                { key: 'email',    label: 'אימייל', type: 'email', dir: 'ltr' as const },
                { key: 'password', label: 'סיסמה', type: 'password', dir: 'ltr' as const, placeholder: 'לפחות 6 תווים' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: 'var(--ink-2)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    dir={f.dir}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    required
                    className="w-full h-11 rounded-[10px] border text-[14px] outline-none transition-all"
                    style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--ink)', paddingInlineEnd: '14px', paddingInlineStart: '14px', fontFamily: 'inherit' }}
                    onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)' }}
                    onBlur={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              ))}

              {error && (
                <p className="text-[13px] font-semibold text-center py-2 px-3 rounded-[8px]"
                  style={{ color: 'var(--red)', background: 'var(--red-bg)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[11px] text-[14.5px] font-extrabold text-white mt-1"
                style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', boxShadow: '0 4px 16px rgba(91,58,171,.25)', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
              >
                {loading ? 'נרשמים...' : 'הרשמה'}
              </button>
            </form>
          </div>

          <div className="px-8 pb-6 text-center" style={{ borderTop: '1px solid var(--line-soft)' }}>
            <p className="text-[13px] pt-4" style={{ color: 'var(--ink-4)' }}>
              <a href="/register" style={{ color: 'var(--purple)', fontWeight: 700 }}>← חזרה</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
