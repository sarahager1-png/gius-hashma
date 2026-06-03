'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DISTRICTS, SPECIALIZATIONS, AVAILABILITY_STATUSES } from '@/lib/constants'

interface Props {
  candidateName: string
  current: {
    district: string | null
    city: string | null
    specialization: string | null
    availability_status: string | null
    whatsapp_preference: boolean | null
  }
}

const SEL = 'w-full h-11 rounded-[12px] border text-[14px] font-medium outline-none px-3.5'
const SS = { background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)' }
const SF = { borderColor: 'var(--purple)', boxShadow: '0 0 0 3px var(--purple-050)' }
const SB = { borderColor: 'var(--line)', boxShadow: 'none' }

export default function SetupFormClient({ candidateName, current }: Props) {
  const router = useRouter()
  const [district, setDistrict] = useState(current.district ?? '')
  const [city, setCity] = useState(current.city ?? '')
  const [specialization, setSpecialization] = useState(current.specialization ?? '')
  const [availability, setAvailability] = useState(current.availability_status ?? '')
  const [whatsapp, setWhatsapp] = useState(current.whatsapp_preference ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = district && city.trim() && specialization && availability

  async function handleSubmit() {
    if (!canSubmit) { setError('יש למלא את כל השדות המסומנים'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate: { district, city: city.trim(), specialization, availability_status: availability, whatsapp_preference: whatsapp },
      }),
    })
    setSaving(false)
    if (res.ok) router.push('/jobs')
    else setError('שגיאה בשמירה, נסי שוב')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-2)' }} dir="rtl">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)', boxShadow: '0 8px 24px rgba(91,58,171,.35)' }}>
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-[26px] font-extrabold mb-1" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
            ברוכה הבאה{candidateName ? `, ${candidateName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>
            כמה פרטים קצרים כדי שנוכל למצוא לך משרות מתאימות
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-[20px] p-6 space-y-5"
          style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: '0 4px 24px rgba(91,58,171,.10)' }}>

          {/* District */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold flex items-center gap-1" style={{ color: 'var(--ink-2)' }}>
              מחוז <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select value={district} onChange={e => setDistrict(e.target.value)}
              className={SEL} style={SS}
              onFocus={e => Object.assign(e.currentTarget.style, SF)}
              onBlur={e => Object.assign(e.currentTarget.style, SB)}>
              <option value="">— בחרי מחוז —</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold flex items-center gap-1" style={{ color: 'var(--ink-2)' }}>
              עיר מגורים <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="לדוגמה: חיפה"
              className={SEL} style={{ ...SS, padding: '0 14px' }}
              onFocus={e => Object.assign(e.currentTarget.style, { ...SS, ...SF })}
              onBlur={e => Object.assign(e.currentTarget.style, { ...SS, ...SB })} />
          </div>

          {/* Specialization */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold flex items-center gap-1" style={{ color: 'var(--ink-2)' }}>
              התמחות <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => {
                const sel = specialization === s
                return (
                  <button key={s} type="button" onClick={() => setSpecialization(sel ? '' : s)}
                    className="px-3.5 py-2 rounded-[10px] text-[13px] font-semibold border-2 transition-all"
                    style={{ background: sel ? 'var(--purple-050)' : '#fff', borderColor: sel ? 'var(--purple)' : 'var(--line)', color: sel ? 'var(--purple)' : 'var(--ink-3)' }}>
                    {sel ? '✓ ' : ''}{s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold flex items-center gap-1" style={{ color: 'var(--ink-2)' }}>
              סטטוס זמינות <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select value={availability} onChange={e => setAvailability(e.target.value)}
              className={SEL} style={SS}
              onFocus={e => Object.assign(e.currentTarget.style, SF)}
              onBlur={e => Object.assign(e.currentTarget.style, SB)}>
              <option value="">— בחרי סטטוס —</option>
              {AVAILABILITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* WhatsApp preference */}
          <div className="rounded-[12px] p-4 flex items-center justify-between gap-4"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
            <div>
              <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
                קבלת הודעות בוואטסאפ
              </p>
              <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                {whatsapp ? 'הודעות ישלחו לוואטסאפ' : 'הודעות ישלחו ב-SMS'}
              </p>
            </div>
            <button type="button" onClick={() => setWhatsapp(v => !v)}
              className="relative w-12 h-6 rounded-full transition-all shrink-0"
              style={{ background: whatsapp ? 'var(--purple)' : '#D1D5DB' }}>
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ right: whatsapp ? '2px' : 'calc(100% - 22px)' }} />
            </button>
          </div>

          {error && (
            <p className="text-[13px] font-semibold text-center py-2 px-3 rounded-[10px]"
              style={{ color: '#DC4F4F', background: '#FEE5E5' }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="w-full h-12 rounded-[12px] text-[15px] font-extrabold text-white transition-all"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, var(--purple) 0%, #7C3AED 100%)'
                : '#E5E7EB',
              color: canSubmit ? '#fff' : '#9CA3AF',
              boxShadow: canSubmit ? '0 4px 16px rgba(91,58,171,.35)' : 'none',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? 'שומרת...' : 'כניסה למערכת ←'}
          </button>
        </div>

        <p className="text-center text-[12px] mt-4" style={{ color: 'var(--ink-4)' }}>
          ניתן לעדכן את כל הפרטים בכל עת מדף הפרופיל
        </p>
      </div>
    </div>
  )
}
