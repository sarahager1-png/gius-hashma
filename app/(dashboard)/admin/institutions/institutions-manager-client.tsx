'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'
import { Download, Search, X, Send, FileDown, Link2, Copy, CheckCheck, UserPlus } from 'lucide-react'
import ApproveButton from './approve-button'
import AddInstitutionModal from './add-institution-modal'
import ImpersonateButton from '@/components/admin/impersonate-button'

type InstRow = {
  id: string
  profile_id: string
  institution_name: string
  city: string | null
  district: string | null
  school_type: string | null
  is_approved: boolean
  approved_by: string | null
  created_at: string
  owner: { full_name: string | null; phone: string | null } | null
}

type LeadRow = {
  id: string
  institution_name: string
  city: string | null
  phone: string | null
  institution_type: string | null
}

interface Props { institutions: InstRow[]; leads: LeadRow[] }

function LinkResult({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="rounded-[10px] border p-3 space-y-2" style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
      <p className="text-[12px] font-bold" style={{ color: '#15803D' }}>✓ נשלח! הקישור לכניסה:</p>
      <div className="flex items-center gap-2">
        <a href={link} target="_blank" rel="noreferrer" dir="ltr"
          className="flex-1 text-[11.5px] truncate font-medium no-underline"
          style={{ color: 'var(--purple)' }}>
          {link}
        </a>
        <button onClick={copy}
          className="shrink-0 h-7 px-2.5 rounded-[7px] flex items-center gap-1 text-[11.5px] font-semibold border transition-all"
          style={{ borderColor: 'var(--line)', color: copied ? '#15803D' : 'var(--ink-3)', background: '#fff' }}>
          {copied ? <CheckCheck size={12} /> : <Copy size={12} />}{copied ? 'הועתק' : 'העתק'}
        </button>
      </div>
    </div>
  )
}

function SendLoginLinkButton({ institutionId, defaultPhone, defaultName }: {
  institutionId: string
  defaultPhone: string | null
  defaultName: string | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState(defaultPhone ?? '')
  const [name, setName] = useState(defaultName ?? '')
  const [link, setLink] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState('')

  async function send() {
    setLoading(true)
    setErrMsg('')
    const res = await fetch(`/api/admin/institutions/${institutionId}/resend-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() || null, name: name.trim() || null }),
    })
    const d = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) setLink(d.link)
    else setErrMsg(d.error ?? 'שגיאה')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="h-8 px-3 rounded-[8px] flex items-center gap-1.5 text-[12px] font-semibold border transition-all"
        style={{ borderColor: '#C4B5FD', color: 'var(--purple)', background: '#F5F3FF' }}>
        <Link2 size={13} />שלח קישור כניסה
      </button>
    )
  }

  return (
    <div className="rounded-[10px] border p-3 space-y-2 min-w-[260px]" style={{ background: '#F5F3FF', borderColor: '#C4B5FD' }}>
      {link ? <LinkResult link={link} /> : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold block mb-0.5" style={{ color: 'var(--ink-3)' }}>וואטסאפ</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" placeholder="050-0000000"
                className="w-full h-8 rounded-[7px] border px-2 text-[12.5px] outline-none"
                style={{ borderColor: 'var(--line)', background: '#fff' }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-0.5" style={{ color: 'var(--ink-3)' }}>שם</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full h-8 rounded-[7px] border px-2 text-[12.5px] outline-none"
                style={{ borderColor: 'var(--line)', background: '#fff' }} />
            </div>
          </div>
          {errMsg && <p className="text-[11.5px] font-semibold" style={{ color: '#DC2626' }}>{errMsg}</p>}
          <div className="flex gap-1.5">
            <button onClick={send} disabled={loading}
              className="h-7 px-3 rounded-[7px] text-[12px] font-bold text-white transition-all"
              style={{ background: 'var(--purple)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'שולח...' : 'שלח'}
            </button>
            <button onClick={() => setOpen(false)} className="h-7 px-2 text-[12px]" style={{ color: 'var(--ink-4)' }}>ביטול</button>
          </div>
        </>
      )}
    </div>
  )
}

function SendRegistrationLinkPanel({ leads }: { leads: LeadRow[] }) {
  const [show, setShow] = useState(false)
  const [type, setType] = useState<'institution' | 'candidate'>('institution')
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState('')

  function selectLead(id: string) {
    setSelectedLeadId(id)
    const lead = leads.find(l => l.id === id)
    if (lead) {
      if (lead.phone) setPhone(lead.phone)
      setName(lead.institution_name)
    } else {
      setName('')
    }
  }

  function reset() {
    setSelectedLeadId('')
    setPhone('')
    setName('')
    setLink(null)
    setErrMsg('')
  }

  async function send() {
    if (!phone.trim()) return
    setLoading(true)
    setErrMsg('')
    const res = await fetch('/api/admin/send-registration-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), name: name.trim(), type, lead_id: selectedLeadId || undefined }),
    })
    const d = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) setLink(d.link)
    else setErrMsg(d.error ?? 'שגיאה בשליחה')
  }

  return (
    <div>
      <button
        onClick={() => setShow(v => !v)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
        style={{ borderColor: 'var(--purple)', color: 'var(--purple)', background: show ? 'var(--purple-050)' : '#fff' }}
      >
        <UserPlus size={14} />שלח קישור הרשמה
      </button>

      {show && (
        <div className="rounded-[14px] border p-4 mb-6 mt-2" style={{ background: '#FAF5FF', borderColor: '#DDD6FE' }}>
          {/* type tabs */}
          <div className="flex gap-2 mb-4">
            {(['institution', 'candidate'] as const).map(t => (
              <button key={t} onClick={() => { setType(t); reset() }}
                className="h-8 px-3.5 rounded-[8px] text-[12.5px] font-bold transition-all border"
                style={{
                  background: type === t ? 'var(--purple)' : '#fff',
                  color: type === t ? '#fff' : 'var(--ink-3)',
                  borderColor: type === t ? 'var(--purple)' : 'var(--line)',
                }}>
                {t === 'institution' ? '🏫 מוסד חינוכי' : '👩‍🏫 מועמדת'}
              </button>
            ))}
          </div>

          {link ? <LinkResult link={link} /> : (
            <div className="space-y-3">
              {/* leads picker — only for institution type */}
              {type === 'institution' && leads.length > 0 && (
                <div>
                  <label className="text-[12px] font-semibold mb-1 block" style={{ color: 'var(--ink-2)' }}>
                    בחרי מוסד מהרשימה ({leads.length} ממתינים להרשמה)
                  </label>
                  <select value={selectedLeadId} onChange={e => selectLead(e.target.value)}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                    style={{ borderColor: 'var(--line)', background: '#fff' }}>
                    <option value="">— או הזיני ידנית —</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.institution_name}{l.city ? ` · ${l.city}` : ''}{l.phone ? ` · ${l.phone}` : ' · ללא טלפון'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold mb-1 block" style={{ color: 'var(--ink-2)' }}>
                    <span style={{ color: '#DC2626' }}>*</span> מספר וואטסאפ
                  </label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="050-0000000" dir="ltr"
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                    style={{ borderColor: 'var(--line)', background: '#fff' }} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold mb-1 block" style={{ color: 'var(--ink-2)' }}>שם</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder={type === 'institution' ? 'שם המנהלת' : 'שם המועמדת'}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                    style={{ borderColor: 'var(--line)', background: '#fff' }} />
                </div>
              </div>

              {errMsg && <p className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>{errMsg}</p>}

              <div className="flex items-center gap-2">
                <button onClick={send} disabled={loading || !phone.trim()}
                  className="h-9 px-4 rounded-[9px] text-[13px] font-bold text-white transition-all"
                  style={{ background: 'var(--purple)', opacity: loading || !phone.trim() ? 0.6 : 1 }}>
                  {loading ? 'שולח...' : 'שלח קישור וואטסאפ'}
                </button>
                <button onClick={() => setShow(false)} className="text-[13px]" style={{ color: 'var(--ink-4)' }}>סגור</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function InstitutionsManagerClient({ institutions, leads }: Props) {
  const [search, setSearch] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkMsg, setBulkMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number | null>(null)

  function exportFiltered() {
    const headers = ['שם מוסד', 'עיר', 'מחוז', 'סוג', 'שם מנהלת', 'טלפון', 'מאושר', 'תאריך הצטרפות']
    const rows = filtered.map(i => [
      i.institution_name,
      i.city ?? '',
      i.district ?? '',
      i.school_type ?? '',
      i.owner?.full_name ?? '',
      i.owner?.phone ?? '',
      i.is_approved ? 'כן' : 'לא',
      new Date(i.created_at).toLocaleDateString('he-IL'),
    ])
    const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v
    const csv = '﻿' + [headers, ...rows].map(r => r.map(v => escape(String(v))).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `institutions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  async function sendBulk() {
    if (!bulkMsg.trim()) return
    setSending(true)
    const phones = institutions
      .filter(i => i.is_approved && i.owner?.phone)
      .map(i => i.owner!.phone!)
    let ok = 0
    for (const phone of phones) {
      try {
        const res = await fetch('/api/communication/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sms_text: bulkMsg, wa_text: bulkMsg, channel: 'wa', profile_id: null }),
        })
        if (res.ok) ok++
      } catch { /* ignore per-send errors */ }
    }
    // use the WA direct send route for institution phones
    const res2 = await fetch('/api/admin/institutions/bulk-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: bulkMsg }),
    })
    const d = await res2.json().catch(() => ({}))
    setSent(d.sent ?? ok)
    setSending(false)
    setBulkMsg('')
    setTimeout(() => { setSent(null); setShowBulk(false) }, 3000)
  }

  const filtered = !search.trim() ? institutions : (() => {
    const q = search.toLowerCase()
    return institutions.filter(i =>
      i.institution_name.toLowerCase().includes(q) ||
      (i.city ?? '').toLowerCase().includes(q) ||
      (i.district ?? '').toLowerCase().includes(q) ||
      (i.school_type ?? '').toLowerCase().includes(q) ||
      (i.owner?.full_name ?? '').toLowerCase().includes(q) ||
      (i.owner?.phone ?? '').includes(q)
    )
  })()

  const pending  = filtered.filter(i => !i.is_approved)
  const invited  = filtered.filter(i => i.is_approved && !i.approved_by)
  const approved = filtered.filter(i => i.is_approved && i.approved_by)

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מוסדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">
            {institutions.filter(i=>i.is_approved).length} מאושרים
            {institutions.filter(i=>i.is_approved&&!i.approved_by).length > 0 ? ` · ${institutions.filter(i=>i.is_approved&&!i.approved_by).length} ממתינים להשלמת פרטים` : ''}
            {institutions.filter(i=>!i.is_approved).length > 0 ? ` · ${institutions.filter(i=>!i.is_approved).length} ממתינים לאישור` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportFiltered}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--purple)', background: '#fff' }}
          >
            <FileDown size={14} />ייצוא ({filtered.length})
          </button>
          <button
            onClick={() => setShowBulk(v => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
            style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: '#fff' }}
          >
            <Send size={14} />הודעה לכולם
          </button>
          <AddInstitutionModal />
        </div>
      </div>

      <SendRegistrationLinkPanel leads={leads} />

      {/* Bulk message panel */}
      {showBulk && (
        <div className="rounded-[14px] border p-4 mb-6" style={{ background: '#F0FDFB', borderColor: '#99F6E4' }}>
          <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--teal)' }}>
            הודעת וואטסאפ לכל המוסדות המאושרים ({institutions.filter(i=>i.is_approved&&i.owner?.phone).length} מוסדות)
          </p>
          <textarea
            value={bulkMsg}
            onChange={e => setBulkMsg(e.target.value)}
            rows={3}
            placeholder="כתבי את ההודעה..."
            className="w-full rounded-[10px] border p-3 text-[13.5px] outline-none resize-none mb-3"
            style={{ borderColor: 'var(--line)', background: '#fff' }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={sendBulk}
              disabled={sending || !bulkMsg.trim()}
              className="h-9 px-4 rounded-[9px] text-[13px] font-bold text-white transition-all"
              style={{ background: sent !== null ? '#1A7A4A' : 'var(--teal)', opacity: sending || !bulkMsg.trim() ? 0.6 : 1 }}
            >
              {sent !== null ? `✓ נשלח ל-${sent} מוסדות` : sending ? 'שולח...' : 'שלחי'}
            </button>
            <button onClick={() => setShowBulk(false)} className="text-[13px]" style={{ color: 'var(--ink-4)' }}>ביטול</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" style={{ color: 'var(--ink-4)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש שם מוסד, עיר, מחוז, מנהלת, טלפון..."
          className="w-full h-10 rounded-[10px] border ps-9 pe-8 text-[13.5px] outline-none"
          style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute top-1/2 -translate-y-1/2 end-3" style={{ color: 'var(--ink-4)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {search && (
        <p className="text-[13px] mb-4 font-semibold" style={{ color: 'var(--teal)' }}>
          {filtered.length} תוצאות עבור &ldquo;{search}&rdquo;
        </p>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--amber)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--amber)' }}>ממתינים לאישור ({pending.length})</h2>
          </div>
          <div className="space-y-3">
            {pending.map(inst => (
              <div key={inst.id} className="rounded-[16px] overflow-hidden"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)', borderInlineStart: '4px solid var(--amber)' }}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{inst.institution_name}</div>
                    <div className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{inst.city}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                      {inst.owner?.full_name} · {inst.owner?.phone}
                    </div>
                    <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-4)' }}>{formatDate(inst.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <ApproveButton institutionId={inst.id} />
                    <ImpersonateButton profileId={inst.profile_id} label={inst.institution_name} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {invited.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--purple)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--purple)' }}>הוזמנו — ממתינים להשלמת פרטים ({invited.length})</h2>
          </div>
          <div className="space-y-2">
            {invited.map(inst => (
              <div key={inst.id} className="rounded-[14px] p-4 flex items-center justify-between"
                style={{ background: '#fff', border: '1px solid var(--line)', borderInlineStart: '3px solid var(--purple)', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{inst.institution_name}</div>
                  <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                    {inst.city}{inst.owner?.phone ? ` · ${inst.owner.phone}` : ''}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{formatDate(inst.created_at)}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <SendLoginLinkButton institutionId={inst.id} defaultPhone={inst.owner?.phone ?? null} defaultName={inst.owner?.full_name ?? null} />
                  <span className="status-badge" style={{ background: '#EDE9FE', color: 'var(--purple)' }}>הוזמן</span>
                  <ImpersonateButton profileId={inst.profile_id} label={inst.institution_name} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>מוסדות מאושרים ({approved.length})</h2>
        </div>
        {approved.length === 0 ? (
          <div className="card"><div className="empty-state"><p className="empty-state__title">אין מוסדות מאושרים עדיין</p></div></div>
        ) : (
          <div className="space-y-2">
            {approved.map(inst => (
              <div key={inst.id} className="rounded-[14px] p-4 flex items-center justify-between"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{inst.institution_name}</div>
                  <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                    {[inst.city, inst.district, inst.school_type].filter(Boolean).join(' · ')}
                  </div>
                  {inst.owner?.phone && (
                    <a href={`https://wa.me/972${inst.owner.phone.replace(/\D/g,'').replace(/^972/,'').replace(/^0/,'')}?text=${encodeURIComponent('שלום!')}`}
                      target="_blank" rel="noreferrer"
                      className="text-[12px] font-semibold mt-0.5 flex items-center gap-1 w-fit no-underline"
                      style={{ color: '#25D366' }}>
                      📱 {inst.owner.phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <SendLoginLinkButton institutionId={inst.id} defaultPhone={inst.owner?.phone ?? null} defaultName={inst.owner?.full_name ?? null} />
                  <span className="status-badge" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>מאושר</span>
                  <ImpersonateButton profileId={inst.profile_id} label={inst.institution_name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
