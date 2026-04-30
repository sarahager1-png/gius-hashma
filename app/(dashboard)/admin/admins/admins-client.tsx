'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X, UserPlus, ShieldCheck } from 'lucide-react'

type Admin = {
  id: string
  full_name: string
  role: string
  email: string
  created_at: string
}

const PURPLE = 'var(--purple)'
const TEAL   = '#2DD4D4'

function initials(name: string) {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('') || '?'
}

function RoleBadge({ role }: { role: string }) {
  const isSuperAdmin = role === 'אדמין מערכת'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{
        background: isSuperAdmin ? '#EDE9FE' : '#F0FFF4',
        color: isSuperAdmin ? PURPLE : '#166534',
      }}
    >
      <ShieldCheck size={11} />
      {role}
    </span>
  )
}

function AdminRow({
  admin,
  onRename,
  onRemove,
  isSelf,
}: {
  admin: Admin
  onRename: (id: string, name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  isSelf: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(admin.full_name)
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')

  async function save() {
    if (!draft.trim()) return
    setBusy(true); setErr('')
    try {
      await onRename(admin.id, draft.trim())
      setEditing(false)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`להסיר את ${admin.full_name} מרשימת המנהלים?`)) return
    setBusy(true)
    try { await onRemove(admin.id) } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'שגיאה בהסרה')
      setBusy(false)
    }
  }

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-[14px] border"
      style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[15px] font-black shrink-0"
        style={{ background: '#EDE9FE', color: PURPLE }}
      >
        {initials(admin.full_name)}
      </div>

      {/* Name / email */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setDraft(admin.full_name) } }}
            className="w-full text-[15px] font-semibold px-2 py-1 rounded-[8px] border outline-none"
            style={{ borderColor: PURPLE, boxShadow: `0 0 0 3px rgba(91,58,171,.1)`, color: 'var(--ink)' }}
          />
        ) : (
          <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {admin.full_name}
            {isSelf && <span className="text-[11px] font-normal ms-2" style={{ color: 'var(--ink-4)' }}>(אני)</span>}
          </p>
        )}
        {err && <p className="text-[12px] text-red-500 mt-0.5">{err}</p>}
        <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--ink-4)' }} dir="ltr">{admin.email}</p>
      </div>

      {/* Role */}
      <div className="shrink-0 hidden sm:block">
        <RoleBadge role={admin.role} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {editing ? (
          <>
            <button
              onClick={save} disabled={busy}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all"
              style={{ background: '#D1FAE5', color: '#065F46' }}
              title="שמור"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(admin.full_name) }}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-2)', color: 'var(--ink-4)' }}
              title="בטל"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all"
              style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}
              title="עריכת שם"
              onMouseEnter={e => { e.currentTarget.style.background = '#EDE9FE'; e.currentTarget.style.color = PURPLE }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--ink-3)' }}
            >
              <Pencil size={14} />
            </button>
            {!isSelf && (
              <button
                onClick={remove} disabled={busy}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}
                title="הסר מנהל"
                onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--ink-3)' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AddAdminForm({ onAdd }: { onAdd: () => void }) {
  const [open, setOpen]       = useState(false)
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error); setBusy(false); return }
      setOpen(false); setEmail(''); setName('')
      onAdd()
    } catch {
      setErr('שגיאה בחיבור לשרת')
      setBusy(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: '42px', padding: '0 12px',
    borderRadius: '10px', border: '1.5px solid var(--line)',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-2)', color: 'var(--ink)', fontFamily: 'inherit',
    transition: 'border-color .15s',
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[13.5px] font-semibold transition-all"
          style={{ background: PURPLE, color: 'white', boxShadow: '0 4px 14px rgba(91,58,171,.3)' }}
        >
          <UserPlus size={15} />
          הוסף מנהל
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="p-5 rounded-[16px] border"
          style={{ background: '#FAFAFF', borderColor: '#D4CCF0' }}
        >
          <p className="text-[14px] font-bold mb-4" style={{ color: PURPLE }}>הוספת מנהל חדש</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>אימייל (חייב להיות רשום במערכת)</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com" required dir="ltr" style={inp}
                onFocus={e => e.currentTarget.style.borderColor = PURPLE}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--line)'}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--ink-3)' }}>שם (אופציונלי)</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="שם מלא" dir="rtl" style={inp}
                onFocus={e => e.currentTarget.style.borderColor = PURPLE}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--line)'}
              />
            </div>
            {err && (
              <p className="text-[13px] px-3 py-2 rounded-[8px]" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{err}</p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                type="submit" disabled={busy}
                className="flex-1 h-10 rounded-[10px] text-[13.5px] font-semibold text-white transition-all"
                style={{ background: busy ? '#94A3B8' : PURPLE }}
              >
                {busy ? 'שומר...' : 'הוסף מנהל'}
              </button>
              <button
                type="button" onClick={() => { setOpen(false); setErr('') }}
                className="h-10 px-4 rounded-[10px] text-[13.5px] font-semibold border"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: 'white' }}
              >
                ביטול
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default function AdminsClient({
  initialAdmins,
  currentUserId,
}: {
  initialAdmins: Admin[]
  currentUserId: string
}) {
  const [admins, setAdmins] = useState(initialAdmins)

  async function refresh() {
    const res = await fetch('/api/admin/admins')
    if (res.ok) setAdmins(await res.json())
  }

  async function onRename(id: string, name: string) {
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, full_name: name } : a))
  }

  async function onRemove(id: string) {
    const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setAdmins(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>מנהלי מערכת</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--ink-3)' }}>
            {admins.length} מנהלים רשומים · ניתן לערוך שמות, להוסיף ולהסיר
          </p>
        </div>
        <AddAdminForm onAdd={refresh} />
      </div>

      <div className="flex flex-col gap-3">
        {admins.map(admin => (
          <AdminRow
            key={admin.id}
            admin={admin}
            onRename={onRename}
            onRemove={onRemove}
            isSelf={admin.id === currentUserId}
          />
        ))}
        {admins.length === 0 && (
          <p className="text-center text-[14px] py-10" style={{ color: 'var(--ink-4)' }}>אין מנהלים רשומים</p>
        )}
      </div>

      <p className="text-[12px] mt-8" style={{ color: 'var(--ink-4)' }}>
        הסרת מנהל תסיר את גישתו למערכת. המשתמש יוכל להירשם מחדש בתפקיד אחר.
      </p>
    </div>
  )
}
