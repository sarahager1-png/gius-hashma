import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const service = createServiceClient()

  // Admin-only guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { phone, name, type, lead_id } = body as { phone?: string; name?: string; type?: 'institution' | 'candidate'; lead_id?: string }

  if (!phone?.trim()) return NextResponse.json({ error: 'מספר טלפון חסר' }, { status: 400 })
  if (type !== 'institution' && type !== 'candidate') {
    return NextResponse.json({ error: 'סוג רישום חסר' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'
  const link = type === 'institution'
    ? (lead_id ? `${appUrl}/register/institution-form?lead=${lead_id}` : `${appUrl}/register/institution-form`)
    : `${appUrl}/mumedet`

  const greeting = name?.trim() ? `שלום ${name.trim()}! ` : 'שלום! '
  const message = type === 'institution'
    ? `${greeting}הנך מוזמנת להצטרף למערכת "השביל".\nלמילוי פרטי המוסד ולקבלת גישה למערכת: ${link}`
    : `${greeting}הנך מוזמנת להצטרף למערכת "השביל" כמועמדת.\nלרישום: ${link}`

  const sent = await sendWA(phone.trim(), message)

  return NextResponse.json({ ok: sent, link, sent })
}
