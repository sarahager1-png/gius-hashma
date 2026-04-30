'use client'

import { useEffect, useState } from 'react'
import { KeyRound, Plus, Trash2, Copy, Check } from 'lucide-react'

interface Code {
  id: string
  code: string
  label: string | null
  used_at: string | null
  created_at: string
  profiles: { full_name: string | null } | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AccessCodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/access-codes')
    if (res.ok) setCodes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createCode() {
    setCreating(true)
    const res = await fetch('/api/access-codes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim() || null }),
    })
    if (res.ok) {
      const newCode = await res.json()
      setCodes(prev => [newCode, ...prev])
      setLabel('')
    }
    setCreating(false)
  }

  async function deleteCode(id: string) {
    const res = await fetch('/api/access-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setCodes(prev => prev.filter(c => c.id !== id))
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const available = codes.filter(c => !c.used_at)
  const used = codes.filter(c => c.used_at)

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{ background: '#EDE9FE', color: '#5B3E9E' }}>
          <KeyRound size={20} />
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ color: 'var(--ink)' }}>קודי גישה להרשמה</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
            צרי קוד ושלחי למועמדת — היא תשתמש בו להרשמה במערכת
          </p>
        </div>
      </div>

      {/* Create new */}
      <div className="rounded-[16px] border p-5 mb-6" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="text-[14px] font-bold mb-4" style={{ color: 'var(--ink)' }}>יצירת קוד חדש</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[12px] font-semibold block mb-1.5" style={{ color: 'var(--ink-3)' }}>תווית (שם המועמדת) — אופציונלי</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="לדוגמה: מרים כהן"
              className="w-full h-10 px-3 rounded-[8px] border text-[14px] outline-none"
              style={{ borderColor: 'var(--line)' }}
              onKeyDown={e => e.key === 'Enter' && createCode()}
            />
          </div>
          <button
            onClick={createCode}
            disabled={creating}
            className="h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white flex items-center gap-2 shrink-0"
            style={{ background: 'var(--purple)' }}>
            <Plus size={15} />
            {creating ? 'יוצרת...' : 'צרי קוד'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[14px] py-8" style={{ color: 'var(--ink-3)' }}>טוען...</p>
      ) : (
        <>
          {/* Available codes */}
          {available.length > 0 && (
            <div className="rounded-[16px] border mb-4" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--line)' }}>
                <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>זמינים ({available.length})</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {available.map(c => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-[18px] tracking-widest" style={{ color: 'var(--purple)' }}>
                          {c.code}
                        </span>
                        <button onClick={() => copyCode(c.code)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                          {copied === c.code ? <><Check size={10} />הועתק</> : <><Copy size={10} />העתקה</>}
                        </button>
                      </div>
                      {c.label && <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{c.label}</p>}
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-4)' }}>נוצר {fmtDate(c.created_at)}</p>
                    </div>
                    <button onClick={() => deleteCode(c.id)}
                      className="p-2 rounded-[8px] hover:opacity-70 transition-opacity"
                      style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {available.length === 0 && (
            <div className="rounded-[16px] border p-8 text-center mb-4"
              style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין קודים זמינים כרגע</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>צרי קוד חדש למעלה</p>
            </div>
          )}

          {/* Used codes */}
          {used.length > 0 && (
            <div className="rounded-[16px] border" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                <h2 className="text-[14px] font-bold" style={{ color: 'var(--ink-3)' }}>בשימוש ({used.length})</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {used.map(c => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-[16px] tracking-widest line-through" style={{ color: 'var(--ink-4)' }}>
                          {c.code}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#E4F6ED', color: '#1A7A4A' }}>
                          נרשמה
                        </span>
                      </div>
                      {c.label && <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{c.label}</p>}
                      {c.profiles?.full_name && (
                        <p className="text-[12px] mt-0.5 font-semibold" style={{ color: 'var(--ink)' }}>{c.profiles.full_name}</p>
                      )}
                      {c.used_at && <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-4)' }}>נוצל {fmtDate(c.used_at)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
