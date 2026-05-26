'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'
import { Search, X, Send, FileDown, SendHorizonal, Trash2 } from 'lucide-react'
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

function DeleteInstitutionButton({ institutionId, institutionName, onDeleted }: {
  institutionId: string
  institutionName: string
  onDeleted: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/institutions/${institutionId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      onDeleted()
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'שגיאה במחיקה')
    }
    setConfirm(false)
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>למחוק?</span>
        <button onClick={handleDelete} disabled={loading}
          className="h-7 px-2.5 rounded-[7px] text-[12px] font-bold text-white"
          style={{ background: '#DC2626', opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : 'מחק'}
        </button>
        <button onClick={() => setConfirm(false)} className="h-7 px-2 text-[12px]" style={{ color: 'var(--ink-4)' }}>ביטול</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="h-8 w-8 rounded-[8px] flex items-center justify-center border transition-all"
      style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
      title="מחיקת מוסד">
      <Trash2 size={14} />
    </button>
  )
}

export default function InstitutionsManagerClient({ institutions, leads }: Props) {
  const [search, setSearch] = useState('')
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [showBulk, setShowBulk] = useState(false)
  const [bulkMsg, setBulkMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number | null>(null)
  const [bulkRegSending, setBulkRegSending] = useState(false)
  const [bulkRegResult, setBulkRegResult] = useState<{ sent: number; skipped: number } | null>(null)

  function exportFiltered() {
    const headers = ['שם מוסד', 'עיר', 'מחוז', 'סוג', 'שם מנהלת', 'טלפון', 'תאריך הצטרפות']
    const rows = filtered.map(i => [
      i.institution_name,
      i.city ?? '',
      i.district ?? '',
      i.school_type ?? '',
      i.owner?.full_name ?? '',
      i.owner?.phone ?? '',
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
    const res2 = await fetch('/api/admin/institutions/bulk-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: bulkMsg }),
    })
    const d = await res2.json().catch(() => ({}))
    setSent(d.sent ?? 0)
    setSending(false)
    setBulkMsg('')
    setTimeout(() => { setSent(null); setShowBulk(false) }, 3000)
  }

  const filtered = (!search.trim() ? institutions : (() => {
    const q = search.toLowerCase()
    return institutions.filter(i =>
      i.institution_name.toLowerCase().includes(q) ||
      (i.city ?? '').toLowerCase().includes(q) ||
      (i.district ?? '').toLowerCase().includes(q) ||
      (i.school_type ?? '').toLowerCase().includes(q) ||
      (i.owner?.full_name ?? '').toLowerCase().includes(q) ||
      (i.owner?.phone ?? '').includes(q)
    )
  })()).filter(i => !deletedIds.has(i.id))

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מוסדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{institutions.length} מוסדות רשומים</p>
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

      {/* שליחת טופס הרשמה לממתינים */}
      {leads.length > 0 && (
        <div className="rounded-[14px] border p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: '#F5F3FF', borderColor: '#DDD6FE' }}>
          <div>
            <p className="text-[13.5px] font-bold" style={{ color: 'var(--purple)' }}>
              {leads.length} מוסדות עדיין לא נרשמו
            </p>
            {bulkRegResult && (
              <p className="text-[12px] mt-1 font-semibold" style={{ color: '#15803D' }}>
                ✓ נשלח ל-{bulkRegResult.sent} מוסדות{bulkRegResult.skipped > 0 ? ` · ${bulkRegResult.skipped} ללא טלפון דולגו` : ''}
              </p>
            )}
          </div>
          <button
            onClick={async () => {
              setBulkRegSending(true)
              setBulkRegResult(null)
              const res = await fetch('/api/admin/institutions/bulk-send-registration', { method: 'POST' })
              const d = await res.json().catch(() => ({}))
              setBulkRegResult(d)
              setBulkRegSending(false)
            }}
            disabled={bulkRegSending}
            className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-bold text-white transition-all"
            style={{ background: 'var(--purple)', opacity: bulkRegSending ? 0.6 : 1 }}
          >
            <SendHorizonal size={14} />
            {bulkRegSending ? 'שולח...' : `שלחי לכולם (${leads.length})`}
          </button>
        </div>
      )}

      {/* Bulk message panel */}
      {showBulk && (
        <div className="rounded-[14px] border p-4 mb-6" style={{ background: '#F0FDFB', borderColor: '#99F6E4' }}>
          <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--teal)' }}>
            הודעת וואטסאפ לכל המוסדות ({institutions.filter(i => i.owner?.phone).length} מוסדות)
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

      {/* רשימת מוסדות */}
      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><p className="empty-state__title">אין מוסדות רשומים עדיין</p></div></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inst => (
            <div key={inst.id} className="rounded-[14px] p-4 flex items-center justify-between gap-3"
              style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{inst.institution_name}</div>
                <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                  {[inst.city, inst.district, inst.school_type].filter(Boolean).join(' · ')}
                </div>
                {inst.owner?.full_name && (
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{inst.owner.full_name}</div>
                )}
                {inst.owner?.phone && (
                  <a href={`https://wa.me/972${inst.owner.phone.replace(/\D/g,'').replace(/^972/,'').replace(/^0/,'')}?text=${encodeURIComponent('שלום!')}`}
                    target="_blank" rel="noreferrer"
                    className="text-[12px] font-semibold mt-0.5 flex items-center gap-1 w-fit no-underline"
                    style={{ color: '#25D366' }}>
                    📱 {inst.owner.phone}
                  </a>
                )}
                <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-4)' }}>
                  נרשם {formatDate(inst.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ImpersonateButton profileId={inst.profile_id} label={inst.institution_name} />
                <DeleteInstitutionButton institutionId={inst.id} institutionName={inst.institution_name} onDeleted={() => setDeletedIds(prev => new Set(prev).add(inst.id))} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
