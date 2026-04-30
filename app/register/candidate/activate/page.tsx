'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACADEMIC_LEVELS, DISTRICTS } from '@/lib/constants'

const SPECIALIZATIONS = ['כיתות א-ב', 'כיתות ג-ד', 'כיתות ה-ו', 'כל הכיתות']
import { KeyRound, CheckCircle } from 'lucide-react'

export default function ActivateCandidatePage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<'code' | 'form'>('code')
  const [accessCode, setAccessCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeChecking, setCodeChecking] = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    district: '', city: '', college: '', graduation_year: '',
    specialization: '', academic_level: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function validateCode(e: React.FormEvent) {
    e.preventDefault()
    if (!accessCode.trim()) { setCodeError('הכניסי את הקוד'); return }
    setCodeChecking(true)
    setCodeError('')
    const res = await fetch('/api/access-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: accessCode.trim() }),
    })
    const { valid } = await res.json()
    setCodeChecking(false)
    if (!valid) { setCodeError('הקוד אינו תקף או כבר נוצל'); return }
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        role: 'מועמדת',
        full_name: form.full_name,
        phone: form.phone,
        access_code: accessCode.trim().toUpperCase(),
        candidate: {
          city: form.city || null,
          college: form.college || null,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          district: form.district || null,
          specialization: form.specialization || null,
          academic_level: form.academic_level || null,
        },
      }),
    })

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'שגיאה ביצירת פרופיל')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center py-10" style={{ background: '#F2F0F8' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#EDE9FE' }}>
            <KeyRound size={26} style={{ color: '#5B3AAB' }} />
          </div>
          <h1 className="text-[22px] font-extrabold mb-1" style={{ color: '#5B3AAB' }}>הפעלת חשבון</h1>
          <p className="text-[14px] mb-6" style={{ color: '#71717A' }}>
            הכניסי את קוד הגישה שקיבלת בוואצאפ
          </p>
          <form onSubmit={validateCode} className="space-y-4 text-right">
            <div className="space-y-1">
              <Label>קוד גישה</Label>
              <Input
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder="לדוגמה: XK7P2R"
                dir="ltr"
                className="text-center tracking-widest text-lg font-bold"
                maxLength={8}
              />
              {codeError && <p className="text-sm text-red-600">{codeError}</p>}
            </div>
            <Button type="submit" disabled={codeChecking} className="w-full text-white" style={{ background: '#5B3AAB' }}>
              {codeChecking ? 'בודקת...' : 'המשך'}
            </Button>
            <a href="/register/candidate" className="block text-sm text-center" style={{ color: '#71717A' }}>
              ← חזרה לבקשת הצטרפות
            </a>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10" style={{ background: '#F2F0F8' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle size={18} style={{ color: '#1A7A4A' }} />
          <span className="text-sm font-semibold" style={{ color: '#1A7A4A' }}>קוד גישה אומת</span>
          <h1 className="text-xl font-bold me-auto" style={{ color: '#5B3AAB' }}>יצירת חשבון</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>שם מלא</Label>
              <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>טלפון</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>אימייל</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required dir="ltr" />
          </div>

          <div className="space-y-1">
            <Label>סיסמה</Label>
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} required dir="ltr" placeholder="לפחות 6 תווים" />
          </div>

          <hr className="my-2" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>עיר</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>מכללה / אוניברסיטה</Label>
              <Input value={form.college} onChange={e => set('college', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>מחוז</Label>
            <Select onValueChange={v => set('district', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי מחוז" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>התמחות</Label>
              <Select onValueChange={v => set('specialization', v)}>
                <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>רמה אקדמית</Label>
              <Select onValueChange={v => set('academic_level', v)}>
                <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
                <SelectContent>
                  {ACADEMIC_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>שנת סיום לימודים</Label>
            <Input type="number" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="2025" dir="ltr" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full text-white" style={{ background: '#5B3AAB' }}>
            {loading ? 'יוצרת חשבון...' : 'יצירת חשבון'}
          </Button>
        </form>
      </div>
    </div>
  )
}
