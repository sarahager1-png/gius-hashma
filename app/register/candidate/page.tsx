'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACADEMIC_LEVELS, ACADEMIC_LEVELS_WITH_EXPERIENCE } from '@/lib/constants'

export default function RegisterCandidatePage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    city: '', college: '', graduation_year: '',
    academic_level: '', years_experience: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const showExperience = ACADEMIC_LEVELS_WITH_EXPERIENCE.includes(form.academic_level as never)

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
        candidate: {
          city: form.city || null,
          college: form.college || null,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          specialization: 'יסודי',
          academic_level: form.academic_level || null,
          years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        },
      }),
    })

    if (!res.ok) {
      setError('שגיאה ביצירת פרופיל')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10" style={{ background: '#F2F0F8' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-6">
          <a href="/register" className="text-sm text-gray-400 hover:text-gray-600">← חזרה</a>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#5B3AAB' }}>הרשמה כמועמדת</h1>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>שנת סיום</Label>
              <Input type="number" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="2025" dir="ltr" />
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

          {showExperience && (
            <div className="space-y-1">
              <Label>שנות ותק</Label>
              <Input
                type="number"
                min={0}
                value={form.years_experience}
                onChange={e => set('years_experience', e.target.value)}
                dir="ltr"
                placeholder="מספר שנות ניסיון"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full text-white" style={{ background: '#5B3AAB' }}>
            {loading ? 'נרשמת...' : 'הרשמה'}
          </Button>
        </form>
      </div>
    </div>
  )
}
