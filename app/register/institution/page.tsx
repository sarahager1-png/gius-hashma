'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DISTRICTS } from '@/lib/constants'
import { CheckCircle, ChevronDown } from 'lucide-react'
import Image from 'next/image'

const INPUT_CLS = `w-full h-10 px-3 rounded-[8px] border text-[14px] outline-none bg-white
  focus:border-purple focus:ring-2 focus:ring-purple-100 transition-all`
const INPUT_STYLE = { borderColor: 'var(--line)', color: 'var(--ink)' }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0 border-b last:border-0" style={{ borderColor: 'var(--line-soft)' }}>
      <div className="flex-shrink-0 w-36 py-3 pe-4 text-[13px] font-semibold text-right leading-10"
        style={{ color: 'var(--ink-3)' }}>
        {label}
      </div>
      <div className="flex-1 py-2.5">
        {children}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[16px]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.07)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
        <span className="text-[17px]">{icon}</span>
        <span className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function NativeSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]
}) {
  return (
    <div className="relative" style={{ maxWidth: '240px' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 pe-8 ps-3 rounded-[8px] border text-[14px] outline-none bg-white appearance-none cursor-pointer focus:border-purple focus:ring-2 focus:ring-purple-100 transition-all"
        style={{ borderColor: 'var(--line)', color: value ? 'var(--ink)' : 'var(--ink-4)' }}>
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--ink-4)' }} />
    </div>
  )
}

export default function RegisterInstitutionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    // auth
    email: '', password: '',
    // principal
    principal_name: '', principal_phone: '',
    // contact
    contact_name: '', contact_phone: '',
    // institution
    institution_name: '', institution_type: '', district: '', city: '', address: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.institution_name.trim() || !form.principal_name.trim() || !form.principal_phone.trim()) {
      setError('יש למלא שם מוסד, שם מנהלת וטלפון')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'שגיאה בהרשמה')
      setLoading(false)
      return
    }

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'מוסד',
        full_name: form.contact_name || form.principal_name,
        phone: form.contact_phone || form.principal_phone,
        institution: {
          institution_name: form.institution_name.trim(),
          district: form.district || null,
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          phone: form.principal_phone.trim() || null,
          principal_name: form.principal_name.trim() || null,
          principal_phone: form.principal_phone.trim() || null,
          contact_name: form.contact_name.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          institution_type: form.institution_type || null,
        },
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה ביצירת פרופיל')
      return
    }

    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-2)' }}>
      <div className="bg-white rounded-[20px] shadow-xl p-10 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: '#E4F6ED' }}>
          <CheckCircle size={32} style={{ color: '#1A7A4A' }} />
        </div>
        <h2 className="text-[22px] font-extrabold mb-2" style={{ color: '#1A7A4A' }}>הרשמה הושלמה!</h2>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
          חשבונך ממתין לאישור מנהל הרשת.
          <br />
          תקבלי הודעה עם האישור.
        </p>
        <a href="/login" className="block mt-6 py-2.5 rounded-[10px] text-sm font-bold"
          style={{ background: 'var(--bg-2)', color: 'var(--purple)' }}>כניסה למערכת ←</a>
      </div>
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen py-10 px-4" style={{ background: 'var(--bg-2)' }}>
      <div className="w-full max-w-xl mx-auto space-y-4">

        {/* header */}
        <div className="rounded-[20px] text-center py-8 px-6"
          style={{ background: 'linear-gradient(135deg,var(--purple),var(--teal))', boxShadow: '0 4px 20px rgba(91,58,171,.35)' }}>
          <div className="w-[72px] h-[72px] rounded-[16px] bg-white mx-auto mb-4 flex items-center justify-center shadow overflow-hidden">
            <Image src="/logo-chabad.png" alt="לוגו" width={60} height={60} className="object-contain" />
          </div>
          <h1 className="text-[24px] font-extrabold text-white">הרשמת מוסד</h1>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,.7)' }}>
            לאחר הרשמה, חשבונך יאושר על ידי מנהל הרשת
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* פרטי כניסה */}
          <Section title="פרטי כניסה" icon="🔐">
            <Row label="אימייל">
              <input className={INPUT_CLS} style={INPUT_STYLE} type="email"
                value={form.email} onChange={e => set('email', e.target.value)} required dir="ltr" />
            </Row>
            <Row label="סיסמה">
              <input className={INPUT_CLS} style={INPUT_STYLE} type="password"
                value={form.password} onChange={e => set('password', e.target.value)}
                required dir="ltr" placeholder="לפחות 6 תווים" />
            </Row>
          </Section>

          {/* פרטי המוסד */}
          <Section title="פרטי המוסד" icon="🏫">
            <Row label="שם המוסד">
              <input className={INPUT_CLS} style={INPUT_STYLE}
                value={form.institution_name} onChange={e => set('institution_name', e.target.value)} required />
            </Row>
            <Row label="סוג מוסד">
              <NativeSelect value={form.institution_type} onChange={v => set('institution_type', v)}
                placeholder="בחרי" options={['בית חינוך', 'קהילתי', 'שלהבות חב"ד']} />
            </Row>
            <Row label="מחוז">
              <NativeSelect value={form.district} onChange={v => set('district', v)}
                placeholder="בחרי מחוז" options={DISTRICTS} />
            </Row>
            <Row label="עיר">
              <input className={INPUT_CLS} style={INPUT_STYLE}
                value={form.city} onChange={e => set('city', e.target.value)} />
            </Row>
            <Row label="כתובת">
              <input className={INPUT_CLS} style={INPUT_STYLE}
                value={form.address} onChange={e => set('address', e.target.value)} placeholder="רחוב, מספר בית" />
            </Row>
          </Section>

          {/* מנהלת */}
          <Section title="מנהלת המוסד" icon="👩‍💼">
            <Row label="שם מנהלת">
              <input className={INPUT_CLS} style={INPUT_STYLE}
                value={form.principal_name} onChange={e => set('principal_name', e.target.value)} required />
            </Row>
            <Row label="טלפון">
              <input className={INPUT_CLS} style={{ ...INPUT_STYLE, maxWidth: '200px' }}
                value={form.principal_phone} onChange={e => set('principal_phone', e.target.value)}
                dir="ltr" required placeholder="05X-XXXXXXX" />
            </Row>
          </Section>

          {/* איש קשר */}
          <Section title="איש קשר" icon="📞">
            <Row label="שם">
              <input className={INPUT_CLS} style={INPUT_STYLE}
                value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </Row>
            <Row label="טלפון">
              <input className={INPUT_CLS} style={{ ...INPUT_STYLE, maxWidth: '200px' }}
                value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                dir="ltr" placeholder="05X-XXXXXXX" />
            </Row>
          </Section>

          {error && (
            <div className="rounded-[10px] px-4 py-3 text-[13px] font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-[12px] text-[15px] font-bold text-white transition-all"
            style={{ background: loading ? 'var(--ink-4)' : 'linear-gradient(135deg,var(--purple),var(--teal))', boxShadow: '0 4px 14px rgba(91,58,171,.3)' }}>
            {loading ? 'נרשמים...' : 'שליחת בקשת הרשמה ←'}
          </button>

          <p className="text-center text-[13px] pb-4" style={{ color: 'var(--ink-4)' }}>
            <a href="/register" style={{ color: 'var(--purple)', fontWeight: 600 }}>← חזרה</a>
          </p>
        </form>
      </div>
    </div>
  )
}
