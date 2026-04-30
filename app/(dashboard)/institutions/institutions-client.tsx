'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, MapPin, CheckCircle, Clock, X, Phone, User, MessageCircle, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Institution } from '@/lib/types'

const INST_TYPES = ['בית חינוך', 'קהילתי', 'שלהבות חב"ד']

const TYPE_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  'בית חינוך':      { bg: '#EDE9FE', color: 'var(--purple)', dot: '#7C3AED' },
  'קהילתי':         { bg: '#E0F2FE', color: '#0369A1', dot: '#0EA5E9' },
  'שלהבות חב"ד':   { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
}

const TYPE_AVATAR: Record<string, { bg: string; color: string }> = {
  'בית חינוך':      { bg: '#EDE9FE', color: 'var(--purple)' },
  'קהילתי':         { bg: '#E0F2FE', color: '#0369A1' },
  'שלהבות חב"ד':   { bg: '#FEF3C7', color: '#92400E' },
}

interface Props { institutions: Institution[] }

export default function InstitutionsClient({ institutions }: Props) {
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('הכל')
  const [typeFilter, setTypeFilter]   = useState('הכל')
  const [approvingId, setApprovingId]       = useState<string | null>(null)
  const [approvedName, setApprovedName]     = useState<string | null>(null)
  const [approvedNotify, setApprovedNotify] = useState<{ name: string; phone: string } | null>(null)
  const [showAdd, setShowAdd]           = useState(false)
  const [addForm, setAddForm]           = useState({ name: '', city: '', type: INST_TYPES[0], principal: '', phone: '', address: '' })
  const [saved, setSaved]               = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState('')
  const router                        = useRouter()
  const [, startTransition]           = useTransition()

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    const res = await fetch('/api/institutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setSaveError(d.error ?? 'שגיאה בשמירה')
      return
    }
    setSaved(true)
    setTimeout(() => {
      setSaved(false); setShowAdd(false)
      setAddForm({ name: '', city: '', type: INST_TYPES[0], principal: '', phone: '', address: '' })
      startTransition(() => router.refresh())
    }, 1800)
  }

  async function approve(id: string, name: string) {
    setApprovingId(id)
    const res = await fetch(`/api/institutions/${id}/approve`, { method: 'POST' })
    setApprovingId(null)
    setApprovedName(name)
    setFilter('פעילים')
    startTransition(() => router.refresh())
    if (res.ok) {
      const data = await res.json()
      if (data.phone) setApprovedNotify({ name: data.name || name, phone: data.phone })
    }
    setTimeout(() => { setApprovedName(null); setApprovedNotify(null) }, 12000)
  }

  function buildWaLink(name: string, phone: string) {
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '972')
    const text = encodeURIComponent(`שלום,\nמוסדכם "${name}" אושר במערכת גיוס והשמה חב"ד.\nכעת תוכלו להיכנס למערכת ולפרסם משרות.\nבברכה, צוות המערכת`)
    return `https://wa.me/${normalized}?text=${text}`
  }

  const filtered = institutions.filter(i => {
    if (filter === 'ממתינים' && i.is_approved)  return false
    if (filter === 'פעילים'  && !i.is_approved) return false
    if (typeFilter !== 'הכל' && i.institution_type !== typeFilter) return false
    const q = search.toLowerCase()
    if (q && !i.institution_name.includes(q) && !(i.city ?? '').includes(q)) return false
    return true
  })

  const approvedCount = institutions.filter(i =>  i.is_approved).length
  const pendingCount  = institutions.filter(i => !i.is_approved).length

  return (
    <div className="p-4 md:p-8">

      {/* Approval toast */}
      {approvedName && (
        <div className="fixed bottom-6 start-6 z-50 rounded-[14px] shadow-xl p-4 max-w-sm"
          style={{ background: '#E4F6ED', border: '1px solid #A7F3D0', color: '#1A7A4A' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} />
            <span className="text-[14px] font-bold">{approvedName} אושר בהצלחה!</span>
          </div>
          {approvedNotify && (
            <div className="flex gap-2">
              <a href={buildWaLink(approvedNotify.name, approvedNotify.phone)} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-white"
                style={{ background: '#25D366' }}>
                <MessageCircle size={13} />שלחי וואצאפ
              </a>
              <a href={`mailto:?subject=${encodeURIComponent('אישור הרשמה למערכת גיוס')}&body=${encodeURIComponent(`שלום,\nמוסדכם "${approvedNotify.name}" אושר במערכת.\nבברכה`)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-white"
                style={{ background: '#3B82F6' }}>
                <Mail size={13} />שלחי מייל
              </a>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">מוסדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{approvedCount} מוסדות פעילים · {pendingCount} ממתינים לאישור</p>
        </div>
        <button
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white transition-all"
          style={{ background: 'var(--purple)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#4a3190'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--purple)'}
          onClick={() => setShowAdd(true)}>
          <Plus size={16} />הוסף מוסד
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
            style={{ color: 'var(--ink-4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש מוסד..."
            className="w-full h-10 rounded-[10px] border text-[14px] font-medium outline-none"
            style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)',
              paddingInlineEnd: '36px', paddingInlineStart: '14px' }} />
        </div>

        {/* Status filter */}
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
          {['הכל', 'פעילים', 'ממתינים'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
              style={filter === s
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
                : { color: 'var(--ink-3)' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--bg-2)' }}>
          {(['הכל', ...INST_TYPES] as string[]).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all"
              style={typeFilter === t
                ? { background: '#fff', color: 'var(--purple)', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }
                : { color: 'var(--ink-3)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Add Institution Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.45)' }}
          onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-extrabold" style={{ color: 'var(--ink)' }}>הוספת מוסד חדש</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: 'var(--ink-4)' }}><X size={20} /></button>
            </div>
            {saved ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#E4F6ED' }}>
                  <CheckCircle size={28} color="#1A7A4A" />
                </div>
                <p className="text-[16px] font-bold" style={{ color: '#1A7A4A' }}>המוסד נוסף בהצלחה</p>
              </div>
            ) : (
              <div className="space-y-3">
                <FRow label="שם מוסד *">
                  <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }} />
                </FRow>
                <div className="grid grid-cols-2 gap-3">
                  <FRow label="עיר">
                    <input value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }} />
                  </FRow>
                  <FRow label="סוג מוסד">
                    <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
                      {INST_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </FRow>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FRow label="שם מנהלת">
                    <input value={addForm.principal} onChange={e => setAddForm(f => ({ ...f, principal: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }} />
                  </FRow>
                  <FRow label="טלפון">
                    <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }} dir="ltr" />
                  </FRow>
                </div>
                <FRow label="כתובת">
                  <input value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] font-medium outline-none"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }} />
                </FRow>
                {saveError && (
                  <div className="rounded-[8px] px-3 py-2 text-[13px] font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                    {saveError}
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowAdd(false)} className="h-10 px-5 rounded-[10px] border text-[14px] font-semibold"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>ביטול</button>
                  <button onClick={handleSave} disabled={!addForm.name || saving}
                    className="h-10 px-6 rounded-[10px] text-[14px] font-semibold text-white"
                    style={{ background: addForm.name && !saving ? 'var(--purple)' : 'var(--bg-2)', color: addForm.name && !saving ? '#fff' : 'var(--ink-4)' }}>
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <p className="text-[15px] font-medium" style={{ color: 'var(--ink-3)' }}>
            {institutions.length === 0 ? 'אין מוסדות במערכת עדיין' : 'לא נמצאו תוצאות'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(inst => {
            const initials = inst.institution_name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')
            const isPending = !inst.is_approved
            const typeStyle = TYPE_STYLE[inst.institution_type ?? ''] ?? { bg: 'var(--purple-050)', color: 'var(--purple)', dot: 'var(--purple)' }
            const avatarStyle = TYPE_AVATAR[inst.institution_type ?? ''] ?? { bg: 'var(--purple-050)', color: 'var(--purple)' }
            const prof = inst.profiles as { full_name: string | null; phone: string | null } | null

            return (
              <div key={inst.id}
                className="rounded-[16px] border flex flex-col transition-all"
                style={{
                  background: isPending ? '#FFFDF5' : '#fff',
                  borderColor: isPending ? '#FDE68A' : 'var(--line)',
                  boxShadow: 'var(--shadow-sm)',
                }}>

                {/* Card top */}
                <div className="p-5 flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[15px] font-extrabold shrink-0"
                      style={avatarStyle}>
                      {initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[15px] leading-snug" style={{ color: 'var(--ink)' }}>
                        {inst.institution_name}
                      </p>
                      {inst.institution_type && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={typeStyle}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeStyle.dot }} />
                          {inst.institution_type}
                        </span>
                      )}
                    </div>
                    {/* Status dot */}
                    <span className="inline-flex items-center gap-1 shrink-0 text-[11.5px] font-bold px-2 py-1 rounded-full"
                      style={isPending
                        ? { background: '#FEF3C7', color: '#92400E' }
                        : { background: '#E4F6ED', color: '#1A7A4A' }}>
                      {isPending ? <Clock size={10} /> : <CheckCircle size={10} />}
                      {isPending ? 'ממתין' : 'פעיל'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    {inst.city && (
                      <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-3)' }}>
                        <MapPin size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                        {inst.city}
                      </div>
                    )}
                    {prof?.full_name && (
                      <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-3)' }}>
                        <User size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                        {prof.full_name}
                      </div>
                    )}
                    {prof?.phone && (
                      <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-3)' }}>
                        <Phone size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                        <a href={`tel:${prof.phone}`} style={{ color: 'var(--teal-600)', textDecoration: 'none' }}>{prof.phone}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 flex items-center justify-end gap-2"
                  style={{ borderTop: `1px solid ${isPending ? '#FDE68A' : 'var(--line-soft)'}` }}>
                  {isPending ? (
                    <button
                      onClick={() => approve(inst.id, inst.institution_name)}
                      disabled={approvingId === inst.id}
                      className="flex-1 h-9 rounded-[10px] text-[13px] font-bold text-white transition-all"
                      style={{ background: 'var(--purple)', opacity: approvingId === inst.id ? 0.7 : 1 }}>
                      {approvingId === inst.id ? 'מאשר...' : '✓ אשר מוסד'}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/institutions/${inst.id}`)}
                      className="h-9 px-4 rounded-[10px] border text-[13px] font-semibold transition-all"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)' }}>
                      צפה בפרטים
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>{label}</label>
      {children}
    </div>
  )
}
