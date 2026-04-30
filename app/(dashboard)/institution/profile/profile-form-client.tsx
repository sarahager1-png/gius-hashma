'use client'

import { useState } from 'react'
import { INSTITUTION_TYPES, DISTRICTS } from '@/lib/constants'

interface Props {
  institution: {
    id: string
    institution_name: string
    city: string | null
    district: string | null
    address: string | null
    phone: string | null
    institution_type: string | null
  }
  profile: {
    full_name: string | null
    phone: string | null
  }
}

export default function InstitutionProfileFormClient({ institution, profile }: Props) {
  const [form, setForm] = useState({
    institution_name: institution.institution_name,
    city: institution.city ?? '',
    district: institution.district ?? '',
    address: institution.address ?? '',
    phone: institution.phone ?? '',
    institution_type: institution.institution_type ?? '',
    principal_name: profile.full_name ?? '',
    principal_phone: profile.phone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.institution_name.trim()) { setError('שם המוסד חובה'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/institutions/${institution.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה בשמירה')
    }
  }

  const inputCls = 'w-full h-10 rounded-[10px] border px-3 text-[14px] outline-none'
  const inputStyle = { borderColor: 'var(--line)', background: '#fff' }

  return (
    <div className="space-y-6 rounded-[18px] border p-6" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>

      <section>
        <h2 className="text-[13px] font-bold uppercase tracking-[.08em] mb-4" style={{ color: 'var(--ink-3)' }}>פרטי המוסד</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>שם המוסד *</label>
            <input value={form.institution_name} onChange={e => set('institution_name', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>סוג מוסד</label>
            <select value={form.institution_type} onChange={e => set('institution_type', e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value="">— בחרי —</option>
              {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>מחוז</label>
            <select value={form.district} onChange={e => set('district', e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value="">— בחרי —</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>עיר</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>כתובת</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>טלפון מוסד</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className={inputCls} style={inputStyle} dir="ltr" />
          </div>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--line)' }} />

      <section>
        <h2 className="text-[13px] font-bold uppercase tracking-[.08em] mb-4" style={{ color: 'var(--ink-3)' }}>פרטי איש הקשר</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>שם מנהל/ת</label>
            <input value={form.principal_name} onChange={e => set('principal_name', e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>טלפון איש קשר</label>
            <input value={form.principal_phone} onChange={e => set('principal_phone', e.target.value)}
              className={inputCls} style={inputStyle} dir="ltr" />
          </div>
        </div>
      </section>

      {error && <p className="text-[13px] font-semibold" style={{ color: '#DC2626' }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-11 px-6 rounded-[10px] text-[14px] font-bold text-white transition-all"
        style={{ background: saved ? '#1A7A4A' : 'var(--purple)', opacity: saving ? 0.7 : 1 }}>
        {saved ? '✓ נשמר' : saving ? 'שומר...' : 'שמירת שינויים'}
      </button>
    </div>
  )
}
