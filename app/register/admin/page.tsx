'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterAdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
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
        role: 'מנהל רשת',
        full_name: form.full_name,
        phone: form.phone,
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="mb-6">
          <a href="/register" className="text-sm text-gray-400 hover:text-gray-600">← חזרה</a>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#C9A84C' }}>הרשמה כמנהל רשת</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>שם מלא</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>טלפון</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>אימייל</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>סיסמה</Label>
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} required dir="ltr" placeholder="לפחות 6 תווים" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full text-white" style={{ background: '#C9A84C' }}>
            {loading ? 'נרשמים...' : 'הרשמה'}
          </Button>
        </form>
      </div>
    </div>
  )
}
