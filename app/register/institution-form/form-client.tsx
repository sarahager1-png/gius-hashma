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

  const inputCls = 'w-full h-10 rounded-[10px] border px-3 text-[14px] outline-none'
  const inputStyle = { borderColor: 'var(--line)', background: '#fff' }

  if (done) {
    return (
      <div className="rounded-[20px] p-8 text-center"
        style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.12)', border: '1px solid #DDD6FE' }}>
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-[22px] font-extrabold mb-2" style={{ color: 'var(--purple)' }}>
          ההרשמה הושלמה!
        </h2>
        <p className="text-[14px] leading-relaxed" style={{ color: '#6D28D9' }}>
          {form.principal_phone
            ? <>קישור כניסה נשלח לוואטסאפ שלך — <strong>{form.principal_phone}</strong>.</>
            : <>קישור כניסה נשלח לכתובת <strong>{form.email}</strong>.</>
          }
        </p>
        <p className="text-[13px] mt-4" style={{ color: '#9CA3AF' }}>
          לחצי על הקישור כדי להכנס למערכת ולהתחיל לפרסם משרות.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[20px] p-6 space-y-5"
      style={{ background: '#fff', boxShadow: '0 8px 40px rgba(91,58,171,.12)', border: '1px solid #DDD6FE' }}>

      {/* פרטים אישיים */}
      <div>
        <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>פרטים אישיים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>שם מנהלת <span style={{ color: '#DC2626' }}>*</span></label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={inputCls} style={inputStyle} placeholder="שם מלא" />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              <span style={{ color: '#25D366' }}>●</span> טלפון / וואטסאפ
            </label>
            <input value={form.principal_phone} onChange={e => set('principal_phone', e.target.value)}
              className={inputCls} style={inputStyle} dir="ltr" placeholder="050-0000000" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>כתובת מייל <span style={{ color: '#DC2626' }}>*</span></label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              className={inputCls} style={inputStyle} type="email" dir="ltr" placeholder="name@example.com" />
            <p className="text-[11.5px]" style={{ color: 'var(--ink-4)' }}>קישור כניסה ישלח לכתובת זו</p>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--line)' }} />

      {/* פרטי המוסד */}
      <div>
        <h2 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>פרטי המוסד</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
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
          <div className="col-span-2 space-y-2">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>סוג מוסד <span style={{ color: '#DC2626' }}>*</span></label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map(t => {
                const sel = form.school_type === t
                const c = TYPE_COLORS[t] ?? { bg: '#F3F4F6', color: '#374151' }
                return (
                  <button key={t} type="button" onClick={() => set('school_type', sel ? '' : t)}
                    className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all"
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
        {loading ? 'שולח...' : 'סיימתי — שלחי לי קישור כניסה ←'}
      </button>
    </div>
  )
}
