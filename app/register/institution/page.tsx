'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { INSTITUTION_TYPES } from '@/lib/constants'

export default function RegisterInstitutionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    institution_name: '', city: '', address: '', institution_type: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
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
        role: 'מוסד',
        full_name: form.full_name,
        phone: form.phone,
        institution: {
          institution_name: form.institution_name,
          city: form.city || null,
          address: form.address || null,
          phone: form.phone || null,
          institution_type: form.institution_type || null,
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
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#00B4CC' }}>הרשמה כמוסד</h1>
          <p className="text-sm text-gray-500 mt-1">לאחר הרשמה, חשבונך יאושר על ידי מנהל הרשת</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>שם איש קשר</Label>
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

          <div className="space-y-1">
            <Label>שם המוסד</Label>
            <Input value={form.institution_name} onChange={e => set('institution_name', e.target.value)} required />
          </div>

          <div className="space-y-1">
            <Label>סוג מוסד</Label>
            <Select onValueChange={v => set('institution_type', v)}>
              <SelectTrigger><SelectValue placeholder="בחרי" /></SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>עיר</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>כתובת</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full text-white" style={{ background: '#00B4CC' }}>
            {loading ? 'נרשמים...' : 'הרשמה'}
          </Button>
        </form>
      </div>
    </div>
  )
}
