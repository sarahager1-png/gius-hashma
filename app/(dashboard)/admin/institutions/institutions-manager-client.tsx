'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { Search, X, Send, FileDown, SendHorizonal, Trash2, Edit, Clock } from 'lucide-react'
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

type EditInstTarget = { kind: 'inst'; data: InstRow } | { kind: 'lead'; data: LeadRow } | null

export default function InstitutionsManagerClient({ institutions, leads }: Props) {
  const [search, setSearch]             = useState('')
  const [deletedIds, setDeletedIds]     = useState<Set<string>>(new Set())
  const [deletedLeadIds, setDeletedLeadIds] = useState<Set<string>>(new Set())
  const [showBulk, setShowBulk]         = useState(false)
  const [bulkMsg, setBulkMsg]           = useState('')
  const [sending, setSending]           = useState(false)
  const [sent, setSent]                 = useState<number | null>(null)
  const [bulkRegSending, setBulkRegSending] = useState(false)
  const [bulkRegResult, setBulkRegResult]   = useState<{ sent: number; skipped: number } | null>(null)
  const [showLeads, setShowLeads]       = useState(false)
  const [leadSearch, setLeadSearch]     = useState('')

  const [editTarget, setEditTarget]     = useState<EditInstTarget>(null)
  const [editForm, setEditForm]         = useState({ institution_name: '', city: '', phone: '', principal_name: '' })
  const [editSaving, setEditSaving]     = useState(false)
  const [editError, setEditError]       = useState('')

  // local state overrides after edit (optimistic)
  const [editedInsts, setEditedInsts]   = useState<Map<string, Partial<InstRow>>>(new Map())
  const [editedLeads, setEditedLeads]   = useState<Map<string, Partial<LeadRow>>>(new Map())

  function openEdit(target: EditInstTarget) {
    if (!target) return
    if (target.kind === 'inst') {
      setEditForm({
        institution_name: target.data.institution_name,
        city: target.data.city ?? '',
        phone: target.data.owner?.phone ?? '',
        principal_name: target.data.owner?.full_name ?? '',
      })
    } else {
      setEditForm({
        institution_name: target.data.institution_name,
        city: target.data.city ?? '',
        phone: target.data.phone ?? '',
        principal_name: '',
      })
    }
    setEditTarget(target)
    setEditError('')
  }

  async function handleEditSave() {
    if (!editTarget) return
    setEditSaving(true); setEditError('')
    const url = editTarget.kind === 'inst'
      ? `/api/admin/institutions/${editTarget.data.id}`
      : `/api/admin/institution-leads/${editTarget.data.id}`
    const body = editTarget.kind === 'inst'
      ? { institution_name: editForm.institution_name, city: editForm.city, principal_name: editForm.principal_name }
      : { institution_name: editForm.institution_name, city: editForm.city, phone: editForm.phone }
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setEditSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setEditError(d.error ?? 'שגיאה'); return }
    // optimistic update
    if (editTarget.kind === 'inst') {
      setEditedInsts(m => new Map(m).set(editTarget.data.id, { institution_name: editForm.institution_name, city: editForm.city }))
    } else {
      setEditedLeads(m => new Map(m).set(editTarget.data.id, { institution_name: editForm.institution_name, city: editForm.city, phone: editForm.phone }))
    }
    setEditTarget(null)
  }

  async function deleteLead(id: string, name: string) {
    if (!confirm(`למחוק את "${name}"?`)) return
    const res = await fetch(`/api/admin/institution-leads/${id}`, { method: 'DELETE' })
    if (res.ok) setDeletedLeadIds(prev => new Set(prev).add(id))
    else alert('שגיאה במחיקה')
  }

  function exportFiltered() {
    const headers = ['שם מוסד', 'עיר', 'מחוז', 'סוג', 'שם מנהלת', 'טלפון', 'תאריך הצטרפות']
    const rows = filtered.map(i => [
      editedInsts.get(i.id)?.institution_name ?? i.institution_name,
      editedInsts.get(i.id)?.city ?? i.city ?? '',
      i.district ?? '', i.school_type ?? '',
      i.owner?.full_name ?? '', i.owner?.phone ?? '',
      new Date(i.created_at).toLocaleDateString('he-IL'),
    ])
    const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v
    const csv = '﻿' + [headers, ...rows].map(r => r.map(v => escape(String(v))).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
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
    setSent(d.sent ?? 0); setSending(false); setBulkMsg('')
    setTimeout(() => { setSent(null); setShowBulk(false) }, 3000)
  }

  const filtered = (!search.trim() ? institutions : (() => {
    const q = search.toLowerCase()
    return institutions.filter(i =>
      (editedInsts.get(i.id)?.institution_name ?? i.institution_name).toLowerCase().includes(q) ||
      (editedInsts.get(i.id)?.city ?? i.city ?? '').toLowerCase().includes(q) ||
      (i.district ?? '').toLowerCase().includes(q) ||
      (i.school_type ?? '').toLowerCase().includes(q) ||
      (i.owner?.full_name ?? '').toLowerCase().includes(q) ||
      (i.owner?.phone ?? '').includes(q)
    )
  })()).filter(i => !deletedIds.has(i.id))

  const filteredLeads = leads.filter(l => {
    if (deletedLeadIds.has(l.id)) return false
    if (!leadSearch.trim()) return true
    const q = leadSearch.toLowerCase()
    return (editedLeads.get(l.id)?.institution_name ?? l.institution_name).toLowerCase().includes(q) ||
      (editedLeads.get(l.id)?.city ?? l.city ?? '').toLowerCase().includes(q) ||
      (editedLeads.get(l.id)?.phone ?? l.phone ?? '').includes(q)
  })

  const visibleLeadCount = leads.filter(l => !deletedLeadIds.has(l.id)).length

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מוסדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{institutions.filter(i => !deletedIds.has(i.id)).length} מוסדות רשומים · {visibleLeadCount} לא נרשמו</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportFiltered}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
            style={{ borderColor: 'var(--line)', color: 'var(--purple)', background: '#fff' }}>
            <FileDown size={14} />ייצוא ({filtered.length})
          </button>
          <button onClick={() => setShowBulk(v => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-bold border transition-all"
            style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: '#fff' }}>
            <Send size={14} />הודעה לכולם
          </button>
          <AddInstitutionModal />
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.45)' }}
          onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold" style={{ color: 'var(--ink)' }}>
                עריכת {editTarget.kind === 'lead' ? 'ליד' : 'מוסד'}
              </h2>
              <button onClick={() => setEditTarget(null)} style={{ color: 'var(--ink-4)' }}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <FRow label="שם מוסד *">
                <input value={editForm.institution_name} onChange={e => setEditForm(f => ({ ...f, institution_name: e.target.value }))}
                  className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                  style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }} />
              </FRow>
              <FRow label="עיר">
                <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                  style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }} />
              </FRow>
              {editTarget.kind === 'inst' ? (
                <FRow label="שם מנהלת">
                  <input value={editForm.principal_name} onChange={e => setEditForm(f => ({ ...f, principal_name: e.target.value }))}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                    style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }} />
                </FRow>
              ) : (
                <FRow label="טלפון / וואטסאפ">
                  <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full h-9 rounded-[8px] border px-3 text-[13px] outline-none"
                    style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }} dir="ltr" />
                </FRow>
              )}
              {editError && (
                <div className="rounded-[8px] px-3 py-2 text-[13px]" style={{ background: '#FEE2E2', color: '#DC2626' }}>{editError}</div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditTarget(null)} className="h-9 px-4 rounded-[9px] border text-[13px] font-semibold"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>ביטול</button>
                <button onClick={handleEditSave} disabled={!editForm.institution_name || editSaving}
                  className="h-9 px-5 rounded-[9px] text-[13px] font-bold text-white"
                  style={{ background: editForm.institution_name && !editSaving ? 'var(--purple)' : 'var(--bg-2)', color: editForm.institution_name && !editSaving ? '#fff' : 'var(--ink-4)' }}>
                  {editSaving ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* לא נרשמו — banner + expandable list */}
      {visibleLeadCount > 0 && (
        <div className="rounded-[14px] border mb-6 overflow-hidden" style={{ borderColor: '#DDD6FE' }}>
          <div className="p-4 flex items-center justify-between gap-4" style={{ background: '#F5F3FF' }}>
            <div>
              <p className="text-[13.5px] font-bold" style={{ color: 'var(--purple)' }}>
                <Clock size={14} className="inline me-1.5 -mt-0.5" />{visibleLeadCount} מוסדות עדיין לא נרשמו
              </p>
              {bulkRegResult && (
                <p className="text-[12px] mt-1 font-semibold" style={{ color: '#15803D' }}>
                  ✓ נשלח ל-{bulkRegResult.sent} מוסדות{bulkRegResult.skipped > 0 ? ` · ${bulkRegResult.skipped} ללא טלפון דולגו` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowLeads(v => !v)}
                className="h-9 px-4 rounded-[10px] text-[13px] font-bold border transition-all"
                style={{ borderColor: '#C4B5FD', color: 'var(--purple)', background: '#fff' }}>
                {showLeads ? 'הסתר רשימה' : 'הצג רשימה'}
              </button>
              <button
                onClick={async () => {
                  setBulkRegSending(true); setBulkRegResult(null)
                  const res = await fetch('/api/admin/institutions/bulk-send-registration', { method: 'POST' })
                  const d = await res.json().catch(() => ({}))
                  setBulkRegResult(d); setBulkRegSending(false)
                }}
                disabled={bulkRegSending}
                className="h-9 px-4 rounded-[10px] text-[13px] font-bold text-white"
                style={{ background: 'var(--purple)', opacity: bulkRegSending ? 0.6 : 1 }}>
                <SendHorizonal size={14} className="inline me-1.5 -mt-0.5" />
                {bulkRegSending ? 'שולח...' : `שלחי לכולם (${visibleLeadCount})`}
              </button>
            </div>
          </div>

          {showLeads && (
            <div style={{ borderTop: '1px solid #DDD6FE' }}>
              <div className="p-3 border-b" style={{ borderColor: '#EDE9FE', background: '#FAF9FF' }}>
                <div className="relative">
                  <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" style={{ color: 'var(--ink-4)' }} />
                  <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                    placeholder="חיפוש..."
                    className="w-full h-8 rounded-[8px] border ps-8 pe-3 text-[13px] outline-none"
                    style={{ borderColor: '#DDD6FE', background: '#fff', color: 'var(--ink)' }} />
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
                {filteredLeads.map(lead => {
                  const overrides = editedLeads.get(lead.id)
                  const name = overrides?.institution_name ?? lead.institution_name
                  const city = overrides?.city ?? lead.city
                  const phone = overrides?.phone ?? lead.phone
                  return (
                    <div key={lead.id} className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: '#FAF9FF' }}>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{name}</div>
                        <div className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                          {[city, phone].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openEdit({ kind: 'lead', data: lead })}
                          className="h-8 w-8 rounded-[8px] flex items-center justify-center border transition-all"
                          style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => deleteLead(lead.id, name)}
                          className="h-8 w-8 rounded-[8px] flex items-center justify-center border transition-all"
                          style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {filteredLeads.length === 0 && (
                  <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--ink-3)', background: '#FAF9FF' }}>לא נמצאו תוצאות</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk message panel */}
      {showBulk && (
        <div className="rounded-[14px] border p-4 mb-6" style={{ background: '#F0FDFB', borderColor: '#99F6E4' }}>
          <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--teal)' }}>
            הודעת וואטסאפ לכל המוסדות ({institutions.filter(i => i.owner?.phone).length} מוסדות)
          </p>
          <textarea value={bulkMsg} onChange={e => setBulkMsg(e.target.value)} rows={3}
            placeholder="כתבי את ההודעה..."
            className="w-full rounded-[10px] border p-3 text-[13.5px] outline-none resize-none mb-3"
            style={{ borderColor: 'var(--line)', background: '#fff' }} />
          <div className="flex items-center gap-2">
            <button onClick={sendBulk} disabled={sending || !bulkMsg.trim()}
              className="h-9 px-4 rounded-[9px] text-[13px] font-bold text-white transition-all"
              style={{ background: sent !== null ? '#1A7A4A' : 'var(--teal)', opacity: sending || !bulkMsg.trim() ? 0.6 : 1 }}>
              {sent !== null ? `✓ נשלח ל-${sent} מוסדות` : sending ? 'שולח...' : 'שלחי'}
            </button>
            <button onClick={() => setShowBulk(false)} className="text-[13px]" style={{ color: 'var(--ink-4)' }}>ביטול</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" style={{ color: 'var(--ink-4)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש שם מוסד, עיר, מחוז, מנהלת, טלפון..."
          className="w-full h-10 rounded-[10px] border ps-9 pe-8 text-[13.5px] outline-none"
          style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink)' }} />
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
          {filtered.map(inst => {
            const overrides = editedInsts.get(inst.id)
            const name = overrides?.institution_name ?? inst.institution_name
            const city = overrides?.city ?? inst.city
            return (
              <div key={inst.id} className="rounded-[14px] p-4 flex items-center justify-between gap-3"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{name}</div>
                  <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                    {[city, inst.district, inst.school_type].filter(Boolean).join(' · ')}
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
                  <button onClick={() => openEdit({ kind: 'inst', data: inst })}
                    className="h-8 w-8 rounded-[8px] flex items-center justify-center border transition-all"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}
                    title="עריכה">
                    <Edit size={14} />
                  </button>
                  <DeleteInstitutionButton institutionId={inst.id} institutionName={inst.institution_name}
                    onDeleted={() => setDeletedIds(prev => new Set(prev).add(inst.id))} />
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
