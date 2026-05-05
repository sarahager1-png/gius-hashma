'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ShieldCheck, RefreshCw, Phone } from 'lucide-react'

export default function VerifyOtpPage() {
  const [status, setStatus]       = useState<'loading' | 'no-phone' | 'form' | 'error'>('loading')
  const [maskedPhone, setMasked]  = useState('')
  const [devCode, setDevCode]     = useState('')
  const [digits, setDigits]       = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [sendErr, setSendErr]     = useState('')
  const [verifyErr, setVerifyErr] = useState('')
  const [cooldown, setCooldown]   = useState(0)
  const [phone, setPhone]         = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { sendCode() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendCode() {
    setSendErr('')
    setStatus('loading')
    const res  = await fetch('/api/auth/send-otp', { method: 'POST' })
    const data = await res.json()
    if (data.skip) { window.location.href = '/dashboard'; return }
    if (data.noPhone) { setStatus('no-phone'); return }
    if (data.error) { setSendErr(data.error); setStatus('error'); return }
    setMasked(data.maskedPhone ?? '')
    if (data.devCode) setDevCode(data.devCode)
    setStatus('form')
    setCooldown(60)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  async function savePhone(e: React.FormEvent) {
    e.preventDefault()
    if (!phone) return
    setSavingPhone(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    setSavingPhone(false)
    if (res.ok) sendCode()
    else setSendErr('שגיאה בשמירת הטלפון')
  }

  function handleDigit(i: number, val: string) {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    if (d && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every(x => x)) verifyCode(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      verifyCode(text)
    }
  }

  async function verifyCode(code: string) {
    setVerifying(true)
    setVerifyErr('')
    const res  = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setVerifying(false)
    if (data.ok) {
      window.location.href = '/dashboard'
    } else {
      setVerifyErr(data.error ?? 'קוד שגוי')
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(94,61,174,.12) 0%, transparent 60%), var(--bg)',
        fontFamily: 'Heebo, system-ui, sans-serif',
      }}
    >
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-16 h-16 rounded-[18px] mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5E3DAE 0%, #00BCC8 100%)', boxShadow: '0 8px 32px rgba(94,61,174,.3)' }}
          >
            <Image src="/logo-chabad.png" alt="לוגו" width={40} height={40} className="object-contain" style={{ filter: 'brightness(10) saturate(0)' }} />
          </div>
          <h1 className="text-[22px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
            אימות זהות
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-4)' }}>אבטחת שני גורמים</p>
        </div>

        <div className="rounded-[20px] overflow-hidden" style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: '0 4px 40px rgba(94,61,174,.10)' }}>
          <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #5E3DAE 0%, #00BCC8 100%)' }} />

          <div className="px-7 py-7">

            {/* Loading */}
            {status === 'loading' && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--purple-050)' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--purple)' }} />
                </div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-3)' }}>שולחת קוד אימות...</p>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="text-center py-6">
                <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--red)' }}>{sendErr}</p>
                <button onClick={sendCode} className="h-10 px-5 rounded-[10px] text-[13.5px] font-bold text-white" style={{ background: 'var(--purple)' }}>
                  נסי שוב
                </button>
              </div>
            )}

            {/* No phone — ask to enter one */}
            {status === 'no-phone' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'var(--teal-050)', color: 'var(--teal)' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-[15px]" style={{ color: 'var(--ink)' }}>הוסיפי מספר טלפון</div>
                    <p className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>כדי לקבל קוד אימות ב-SMS</p>
                  </div>
                </div>
                {sendErr && <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--red)' }}>{sendErr}</p>}
                <form onSubmit={savePhone} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--ink-2)' }}>מספר טלפון</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="05X-XXXXXXX"
                      required
                      dir="ltr"
                      className="w-full h-11 rounded-[10px] text-[14px]"
                      style={{ padding: '0 14px', border: '1.5px solid var(--line)', outline: 'none', background: 'var(--bg-2)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'white' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--bg-2)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="h-11 rounded-[11px] text-[14px] font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg, #5E3DAE 0%, #00BCC8 100%)', boxShadow: '0 4px 16px rgba(94,61,174,.28)', opacity: savingPhone ? 0.7 : 1 }}
                  >
                    {savingPhone ? 'שומרת...' : 'שלחי קוד אימות'}
                  </button>
                </form>
              </>
            )}

            {/* OTP form */}
            {status === 'form' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--purple-050)' }}>
                    <ShieldCheck size={22} style={{ color: 'var(--purple)' }} />
                  </div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
                    קוד נשלח ל-<span dir="ltr">{maskedPhone}</span>
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>הזיני את הקוד בן 6 הספרות</p>
                </div>

                {/* Dev mode hint */}
                {devCode && (
                  <div className="rounded-[10px] p-3 mb-4 text-center text-[13px] font-bold" style={{ background: '#FEF0D9', color: '#C4831D' }}>
                    מצב פיתוח — קוד: <span dir="ltr" style={{ letterSpacing: '0.15em' }}>{devCode}</span>
                  </div>
                )}

                {verifyErr && (
                  <div className="rounded-[10px] p-2.5 mb-4 text-center text-[13px] font-semibold" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                    {verifyErr}
                  </div>
                )}

                {/* 6 digit inputs */}
                <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste} dir="ltr">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-11 h-13 text-center text-[22px] font-bold rounded-[12px]"
                      style={{
                        height: '52px',
                        border: `2px solid ${d ? 'var(--purple)' : 'var(--line)'}`,
                        outline: 'none',
                        background: d ? 'var(--purple-050)' : '#fff',
                        color: 'var(--ink)',
                        transition: 'all .15s',
                      }}
                    />
                  ))}
                </div>

                {verifying && (
                  <p className="text-center text-[13px] font-semibold mb-4" style={{ color: 'var(--ink-4)' }}>מאמתת...</p>
                )}

                <button
                  onClick={sendCode}
                  disabled={cooldown > 0}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13px] font-semibold transition-all"
                  style={{ background: cooldown > 0 ? 'var(--bg-2)' : 'white', color: cooldown > 0 ? 'var(--ink-4)' : 'var(--purple)', border: '1.5px solid var(--line)' }}
                >
                  <RefreshCw size={14} />
                  {cooldown > 0 ? `שלחי שוב בעוד ${cooldown}ש` : 'שלחי קוד חדש'}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11.5px]" style={{ color: 'var(--ink-4)' }}>
          © 2025 רשת חינוך חב״ד · אבטחה מוגברת
        </p>
      </div>
    </div>
  )
}
