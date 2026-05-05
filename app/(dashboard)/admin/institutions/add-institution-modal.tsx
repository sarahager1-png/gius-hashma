'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Building2, Send, CheckCircle2 } from 'lucide-react'

const INST_TYPES = [
  'שלהבות חב"ד',
  'בית חינוך',
  'קהילתי',
  'גן ילדים',
  'בית ספר יסודי',
  'חטיבת ביניים',
  'מוסד אחר',
]

const DISTRICTS = ['ירושלים', 'תל אביב', 'חיפה', 'דרום', 'צפון', 'מרכז', 'שרון', 'שומרון', 'יהודה']

interface FormState {
  name: string
  type: string
  city: string
  principal: string
  phone: string
  email: string
  address: string
}

const EMPTY: FormState = { name: '', type: '', city: '', principal: '', phone: '', email: '', address: '' }

export default function AddInstitutionModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    setError('')
  }

  function close() {
    setOpen(false)
    setForm(EMPTY)
    setError('')
    setSuccess(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('שם המוסד חובה'); return }
    if (!form.email.trim()) { setError('אימייל חובה לשליחת הזמנה'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'שגיאה לא צפויה'); return }
      setSuccess(true)
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
                  <p className="text-[12px]" style={{ color: 'var(--ink-4)' }}>המוסד יקבל הזמנה להשלים פרטים</p>
                </div>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70" style={{ background: 'var(--surface-2)' }}>
                <X size={15} />
              </button>
            </div>

            {success ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 size={48} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
                <p className="text-[17px] font-bold mb-1" style={{ color: 'var(--ink)' }}>המוסד נוסף בהצלחה!</p>
                <p className="text-[13px] mb-6" style={{ color: 'var(--ink-3)' }}>
                  הזמנה נשלחה לאימייל <strong>{form.email}</strong>
                  {form.phone && <> ו-SMS לטלפון <strong>{form.phone}</strong></>}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { setForm(EMPTY); setSuccess(false) }}
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

                  {/* סוג מוסד + עיר */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">סוג מוסד</label>
                      <select className="field-input" value={form.type} onChange={e => set('type', e.target.value)}>
                        <option value="">בחר סוג</option>
                        {INST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">עיר</label>
                      <input className="field-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="ירושלים" />
                    </div>
                  </div>

                  {/* מנהל + טלפון */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">שם מנהל/ת</label>
                      <input className="field-input" value={form.principal} onChange={e => set('principal', e.target.value)} placeholder="שרה לוי" />
                    </div>
                    <div>
                      <label className="field-label">טלפון</label>
                      <input className="field-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050-0000000" dir="ltr" />
                    </div>
                  </div>

                  {/* אימייל */}
                  <div>
                    <label className="field-label">אימייל איש קשר <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input
                      className="field-input"
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="contact@school.org.il"
                      dir="ltr"
                    />
                    <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-4)' }}>קישור הפעלה יישלח לכתובת זו</p>
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
                    {loading ? 'שולח הזמנה...' : 'שלח הזמנה'}
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
