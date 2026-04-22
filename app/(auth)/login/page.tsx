'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('אימייל או סיסמה שגויים')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#5B3AAB' }}>
            <span className="text-white text-2xl font-bold">ג</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#5B3AAB' }}>גיוס והשמה</h1>
          <p className="text-sm text-gray-500 mt-1">רשת אהלי יוסף יצחק</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium"
            style={{ background: '#5B3AAB' }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          אין לך חשבון?{' '}
          <a href="/register" className="font-medium" style={{ color: '#00B4CC' }}>
            הרשמה
          </a>
        </p>
      </div>
    </div>
  )
}
