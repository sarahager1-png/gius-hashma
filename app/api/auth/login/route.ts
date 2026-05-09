import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const email    = typeof body.email    === 'string' ? body.email.trim().slice(0, 254)    : ''
  const password = typeof body.password === 'string' ? body.password.slice(0, 128)        : ''

  if (!email || !password)
    return NextResponse.json({ error: 'אימייל וסיסמה הם שדות חובה' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
