'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Building2, Send, CheckCircle2, Copy, CheckCheck } from 'lucide-react'

interface FormState {
  name: string
  city: string
  principal: string
  phone: string
  address: string
}

const EMPTY: FormState = { name: '', city: '', principal: '', phone: '', address: '' }

export default function AddInstitutionModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ link: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function set(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    setError('')
  }

  function close() {
    setOpen(false)
    setForm(EMPTY)
    setError('')
    setResult(null)
    setCopied(false)
  }

  function copyLink() {
    if (!result) return
    navigator.clipboard.writeText(result.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('שם המוסד חובה'); return }
    if (!form.phone.trim()) { setError('מספר וואטסאפ חובה לשליחת קישור ההרשמה'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/institutions/create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'שגיאה לא צפויה'); return }
      setResult({ link: json.link })
      router.refresh()
    } catch {
      setError('שגיאת רשת — נסי שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold text-white transition-all"
        style={{ background: 'var(--purple)' }}
      >
        <Plus size={15} />
        הוסף מוסד
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className="w-full max-w-lg rounded-[20px] overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--purple-050)' }}>
                  <Building2 size={17} style={{ color: 'var(--purple)' }} />
                </div>
                <div>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>הוספת מוסד חדש</p>
                  <p className="text-[12px]" style={{ color: 'var(--ink-4)' }}>שולח קישור הרשמה לוואטסאפ — המוסד ממלא פרטים ומקבל כניסה</p>
                </div>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70" style={{ background: 'var(--surface-2)' }}>
                <X size={15} />
              </button>
            </div>

            {result ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 size={48} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
                <p className="text-[17px] font-bold mb-1" style={{ color: 'var(--ink)' }}>קישור הרשמה נשלח!</p>
                <p className="text-[13px] mb-5" style={{ color: 'var(--ink-3)' }}>
                  {form.principal && <><strong>{form.principal}</strong> מ-</>}
                  <strong>{form.name}</strong> תקבל קישור וואטסאפ לטופס ההרשמה.
                  <br />לאחר מילוי הפרטים יישלח קישור כניסה לוואטסאפ שלה.
                </p>
                <div className="rounded-[10px] border p-3 mb-5 flex items-center gap-2 text-start"
                  style={{ background: '#F5F3FF', borderColor: '#DDD6FE' }}>
                  <a href={result.link} target="_blank" rel="noreferrer" dir="ltr"
                    className="flex-1 text-[11.5px] truncate font-medium no-underline"
                    style={{ color: 'var(--purple)' }}>
                    {result.link}
                  </a>
                  <button onClick={copyLink}
                    className="shrink-0 h-7 px-2.5 rounded-[7px] flex items-center gap-1 text-[11.5px] font-semibold border"
                    style={{ borderColor: 'var(--line)', color: copied ? '#15803D' : 'var(--ink-3)', background: '#fff' }}>
                    {copied ? <CheckCheck size={12} /> : <Copy size={12} />}{copied ? 'הועתק' : 'העתק'}
                  </button>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { setForm(EMPTY); setResult(null) }}
                    className="h-9 px-4 rounded-[9px] text-[13px] font-bold transition-all"
                    style={{ background: 'var(--purple)', color: '#fff' }}
                  >
                    הוסף מוסד נוסף
                  </button>
                  <button
                    onClick={close}
                    className="h-9 px-4 rounded-[9px] text-[13px] font-semibold transition-all"
                    style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
                  >
                    סגור
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} dir="rtl">
                <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>

                  {/* הסבר הזרימה */}
                  <div className="rounded-[10px] px-4 py-3 text-[12.5px] leading-relaxed"
                    style={{ background: '#EEF2FF', color: '#4338CA' }}>
                    📋 המוסד יקבל קישור וואטסאפ לטופס הרשמה.
                    לאחר מילוי הכל (שם, מייל, מחוז, סוג מוסד) — יישלח אוטומטית קישור כניסה.
                  </div>

                  {/* שם המוסד */}
                  <div>
                    <label className="field-label">שם המוסד <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input
                      className="field-input"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder='למשל: גן ילדים "נצח ישראל"'
                      autoFocus
                    />
                  </div>

                  {/* עיר */}
                  <div>
                    <label className="field-label">עיר</label>
                    <input className="field-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="ירושלים" />
                  </div>

                  {/* מנהל + וואטסאפ */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">שם מנהל/ת</label>
                      <input className="field-input" value={form.principal} onChange={e => set('principal', e.target.value)} placeholder="שרה לוי" />
                    </div>
                    <div>
                      <label className="field-label">
                        <span style={{ color: '#25D366' }}>●</span> וואטסאפ <span style={{ color: 'var(--red)' }}>*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input className="field-input flex-1" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050-0000000" dir="ltr" />
                        {form.phone && (
                          <a href={`https://wa.me/972${form.phone.replace(/\D/g,'').replace(/^972/,'').replace(/^0/,'')}?text=${encodeURIComponent('שלום!')}`}
                            target="_blank" rel="noreferrer"
                            className="shrink-0 h-9 px-2 rounded-[8px] text-[12px] font-bold no-underline flex items-center"
                            style={{ background: '#E7F9EF', color: '#1A7A4A' }}>
                            💬
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* כתובת */}
                  <div>
                    <label className="field-label">כתובת</label>
                    <input className="field-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="רחוב הרצל 1, ירושלים" />
                  </div>

                  {error && (
                    <div className="rounded-[10px] px-4 py-3 text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex gap-2 justify-end" style={{ borderTop: '1px solid var(--line)' }}>
                  <button
                    type="button"
                    onClick={close}
                    className="h-9 px-4 rounded-[9px] text-[13px] font-semibold"
                    style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 h-9 px-5 rounded-[9px] text-[13px] font-bold text-white transition-all"
                    style={{ background: 'var(--purple)', opacity: loading ? 0.7 : 1 }}
                  >
                    <Send size={13} />
                    {loading ? 'שולח...' : 'שלח קישור הרשמה'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
