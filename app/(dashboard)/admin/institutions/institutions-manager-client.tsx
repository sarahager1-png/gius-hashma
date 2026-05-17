'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'
import { Download, Search, X, Send, FileDown } from 'lucide-react'
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

interface Props { institutions: InstRow[] }

export default function InstitutionsManagerClient({ institutions }: Props) {
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

  const filtered = useMemo(() => {
    if (!search.trim()) return institutions
    const q = search.toLowerCase()
    return institutions.filter(i =>
      i.institution_name.toLowerCase().includes(q) ||
      (i.city ?? '').toLowerCase().includes(q) ||
      (i.district ?? '').toLowerCase().includes(q) ||
      (i.school_type ?? '').toLowerCase().includes(q) ||
      (i.owner?.full_name ?? '').toLowerCase().includes(q) ||
      (i.owner?.phone ?? '').includes(q)
    )
  }, [institutions, search])

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
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
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
