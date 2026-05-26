import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendExternal } from '@/lib/notify-external'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const phoneOverride: string | null = body.phone?.trim() || null
  const nameOverride: string | null = body.name?.trim() || null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: inst } = await service
    .from('institutions')
    .select('institution_name, profile_id, profiles(phone, whatsapp_preference, full_name)')
    .eq('id', id)
    .single()
  if (!inst) return NextResponse.json({ error: 'Institution not found' }, { status: 404 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()
  const mosadLink = `${appUrl}/mosad`

  const ownerProfile = inst.profiles as unknown as { phone: string | null; whatsapp_preference: boolean | null; full_name: string | null } | null
  const recipientPhone = phoneOverride ?? ownerProfile?.phone ?? null
  const recipientName  = nameOverride ?? ownerProfile?.full_name ?? null
  const greeting = recipientName ? `שלום ${recipientName}!` : 'שלום!'
  const msg = `${greeting}\nלכניסה למערכת השביל — לחצי כאן:\n${mosadLink}\n\n(היכנסי עם חשבון Google של המייל הרשום)`

  void sendExternal({
    phone: recipientPhone,
    whatsapp_preference: ownerProfile?.whatsapp_preference ?? true,
    waMessage: msg,
    smsMessage: msg,
  })

  return NextResponse.json({ ok: true, link: mosadLink })
}
