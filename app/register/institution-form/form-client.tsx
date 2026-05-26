'use client'

import { useState } from 'react'
import { DISTRICTS, SCHOOL_TYPES, SCHOOL_TYPE_COLORS } from '@/lib/constants'

type Lead = {
  id: string
  institution_name: string
  city: string | null
  phone: string | null
  institution_type: string | null
} | null

const ALL_TYPES = ['גן ילדים', ...SCHOOL_TYPES]
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'גן ילדים': { bg: '#ECFDF5', color: '#065F46' },
  ...Object.fromEntries(Object.entries(SCHOOL_TYPE_COLORS).map(([k, v]) => [k, { bg: v.bg, color: v.color }])),
}

export default function InstitutionFormClient({ lead }: { lead: Lead }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    principal_phone: lead?.phone ?? '',
    institution_name: lead?.institution_name ?? '',
    city: lead?.city ?? '',
    district: '',
    school_type: lead?.institution_type === 'שלהבות' ? 'יסודי - שלהבות' : '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit() {
    if (!form.full_name.trim()) { setError('שם מנהלת חובה'); return }
    if (!form.email.trim() || !form.email.includes('@')) { setError('כתובת מייל תקינה חובה'); return }
    if (!form.institution_name.trim()) { setError('שם המוסד חובה'); return }
    if (!form.district) { setError('מחוז חובה'); return }
    if (!form.school_type) { setError('יש לבחור סוג מוסד'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/register/institution-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lead_id: lead?.id ?? null }),
    })

    setLoading(false)
    if (res.ok) {
      setDone(true)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה בהרשמה. נסי שוב.')
    }
  }

  const inputCls = 'w-full h-11 rounded-[10px] border px-3 text-[16px] outline-none'
  const inputStyle = { borderColor: 'var(--line)', background: '#fff' }

  if (done) {
    return (
      <div className="rounded-[20px] p-6 sm:p-8 text-center"
        style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.12)', border: '1px solid #DDD6FE' }}>
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: '#DCFCE7' }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-[20px] font-extrabold mb-2" style={{ color: 'var(--purple)' }}>
          הפרטים נשמרו בהצלחה!
        </h2>
        <p className="text-[13.5px] leading-relaxed mb-1" style={{ color: '#6D28D9' }}>
          הרשמת המוסד הושלמה.<br />
          כעת יש להיכנס עם חשבון Google של הכתובת:
        </p>
        <p className="text-[14px] font-bold mb-5 dir-ltr" style={{ color: 'var(--ink)' }}>
          {form.email}
        </p>
        <a
          href="/mosad"
          className="flex items-center justify-center gap-2.5 w-full py-3 rounded-[12px] text-[14px] font-bold transition-all"
          style={{ background: 'var(--purple)', color: '#fff', boxShadow: '0 4px 14px rgba(91,58,171,.35)' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          כניסה עם Google
        </a>
        <p className="text-[12px] mt-3" style={{ color: '#9CA3AF' }}>
          יש להיכנס עם אותה כתובת מייל בדיוק — בכל כניסה עתידית
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[20px] p-4 sm:p-6 space-y-5"
      style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.12)', border: '1px solid #DDD6FE' }}>

      {/* פרטים אישיים */}
      <div>
        <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>פרטים אישיים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>שם מנהלת <span style={{ color: '#DC2626' }}>*</span></label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={inputCls} style={inputStyle} dir="rtl" placeholder="שם מלא" />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              <span style={{ color: '#25D366' }}>●</span> טלפון / וואטסאפ
            </label>
            <input value={form.principal_phone} onChange={e => set('principal_phone', e.target.value)}
              className={inputCls} style={inputStyle} dir="ltr" placeholder="050-0000000" />
          </div>
          <div className="col-span-full space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              כתובת מייל — לכניסה למערכת <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              className={inputCls} style={inputStyle} type="email" dir="ltr" placeholder="name@example.com" />
            <p className="text-[11.5px] flex items-center gap-1" style={{ color: 'var(--ink-4)' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" className="flex-shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              הכניסה למערכת היא דרך חשבון Google — יש להזין את כתובת המייל של חשבון גוגל שלך
            </p>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--line)' }} />

      {/* פרטי המוסד */}
      <div>
        <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>פרטי המוסד</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="col-span-full space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>שם המוסד <span style={{ color: '#DC2626' }}>*</span></label>
            <input value={form.institution_name} onChange={e => set('institution_name', e.target.value)}
              className={inputCls} style={inputStyle} placeholder="שם בית הספר / הגן" />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>עיר</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className={inputCls} style={inputStyle} placeholder="עיר" />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>מחוז <span style={{ color: '#DC2626' }}>*</span></label>
            <select value={form.district} onChange={e => set('district', e.target.value)}
              className={inputCls} style={{ ...inputStyle, borderColor: !form.district ? '#FCA5A5' : 'var(--line)' }}>
              <option value="">— בחרי מחוז —</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="col-span-full space-y-2">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>סוג מוסד <span style={{ color: '#DC2626' }}>*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_TYPES.map(t => {
                const sel = form.school_type === t
                const c = TYPE_COLORS[t] ?? { bg: '#F3F4F6', color: '#374151' }
                return (
                  <button key={t} type="button" onClick={() => set('school_type', sel ? '' : t)}
                    className="px-3 py-2 rounded-xl text-[12.5px] font-semibold border-2 transition-all text-center"
                    style={{ background: sel ? c.bg : '#fff', borderColor: sel ? c.color : 'var(--line)', color: sel ? c.color : 'var(--ink-3)' }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-[13px] font-semibold" style={{ color: '#DC2626' }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-12 rounded-[12px] text-[15px] font-bold text-white transition-all"
        style={{ background: 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(91,58,171,.35)' }}>
        {loading ? 'שולח...' : 'סיימתי — שלחי את הפרטים ←'}
      </button>
    </div>
  )
}
