'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [exchanging, setExchanging] = useState(true)

  const exchangeCode = useCallback(async () => {
    const code = searchParams.get('code')
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) setError('הקישור אינו תקין או פג תוקפו. בקשי קישור חדש.')
    }
    setExchanging(false)
  }, [searchParams, supabase])

  useEffect(() => { exchangeCode() }, [exchangeCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (exchanging) return (
    <p className="text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>מאמתת קישור...</p>
  )

  if (done) return (
    <div className="text-center space-y-3 py-4">
      <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
        style={{ background: 'var(--green-bg)' }}>
        <CheckCircle size={26} style={{ color: 'var(--green)' }} />
      </div>
      <p className="text-[14px] font-bold" style={{ color: 'var(--green)' }}>הסיסמה עודכנה בהצלחה!</p>
      <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>מעבירים אותך לדאשבורד...</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { id: 'new-pw',  label: 'סיסמה חדשה',  val: password, set: setPassword, show: showPw, toggle: () => setShowPw(p => !p), ph: 'לפחות 6 תווים' },
        { id: 'conf-pw', label: 'אימות סיסמה', val: confirm,  set: setConfirm,  show: showCf, toggle: () => setShowCf(p => !p), ph: 'הזיני שוב' },
      ].map(f => (
        <div key={f.id}>
          <label htmlFor={f.id} className="block text-[12.5px] font-bold mb-1.5" style={{ color: 'var(--ink-2)' }}>{f.label}</label>
          <div className="relative">
            <input
              id={f.id}
              type={f.show ? 'text' : 'password'}
              value={f.val}
              onChange={e => f.set(e.target.value)}
              placeholder={f.ph}
              required
              dir="ltr"
              className="w-full h-11 rounded-[10px] border text-[14px] outline-none transition-all"
              style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--ink)', paddingInlineEnd: '40px', paddingInlineStart: '14px', fontFamily: 'inherit' }}
              onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-050)' }}
              onBlur={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button type="button" onClick={f.toggle}
              className="absolute inset-y-0 start-3 flex items-center"
              style={{ color: 'var(--ink-4)' }}>
              {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      ))}

      {error && (
        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-center py-2 px-3 rounded-[8px]"
            style={{ color: 'var(--red)', background: 'var(--red-bg)' }}>
            {error}
          </p>
          {error.includes('תקין') && (
            <a href="/login" className="block text-center text-[13px] font-bold" style={{ color: 'var(--purple)' }}>
              ← חזרה לדף הכניסה
            </a>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-[11px] text-[14.5px] font-extrabold text-white mt-1"
        style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', boxShadow: '0 4px 16px rgba(91,58,171,.25)', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
      >
        {loading ? 'שומרת...' : 'עדכון סיסמה'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      dir="rtl"
      style={{ background: 'var(--bg-2)', fontFamily: 'Heebo, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-[400px]">
        <div className="rounded-[24px] overflow-hidden" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.13)', border: '1px solid var(--line)' }}>
          <div className="h-[5px]" style={{ background: 'linear-gradient(90deg, var(--purple), var(--teal))' }} />

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
              איפוס סיסמה
            </div>
          </div>

          <div className="mx-8 h-px" style={{ background: 'var(--line)' }} />

          <div className="px-8 py-6">
            <Suspense fallback={<p className="text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>טוענת...</p>}>
              <ResetForm />
            </Suspense>
          </div>

          <div className="px-8 pb-6 text-center" style={{ borderTop: '1px solid var(--line-soft)' }}>
            <a href="/login" className="text-[13px] font-bold pt-4 block" style={{ color: 'var(--purple)' }}>
              ← חזרה להתחברות
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
