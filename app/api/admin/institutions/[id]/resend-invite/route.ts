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

  // Get institution with owner profile
  const { data: inst } = await service
    .from('institutions')
    .select('institution_name, profile_id, profiles(phone, whatsapp_preference)')
    .eq('id', id)
    .single()
  if (!inst) return NextResponse.json({ error: 'Institution not found' }, { status: 404 })

  // Get auth user email via admin API
  const { data: authUser, error: authErr } = await service.auth.admin.getUserById(inst.profile_id)
  if (authErr || !authUser?.user?.email)
    return NextResponse.json({ error: 'לא נמצא מייל למוסד זה' }, { status: 400 })

  const email = authUser.user.email

  // Generate a fresh magic link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'
  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/institution/profile` },
  })
  if (linkErr || !linkData?.properties?.action_link)
    return NextResponse.json({ error: linkErr?.message ?? 'שגיאה ביצירת קישור' }, { status: 500 })

  const link = linkData.properties.action_link
  const ownerProfile = inst.profiles as unknown as { phone: string | null; whatsapp_preference: boolean | null } | null

  const recipientPhone = phoneOverride ?? ownerProfile?.phone ?? null
  const recipientName  = nameOverride ?? null
  const greeting = recipientName ? `שלום ${recipientName}!` : 'שלום!'
  const msg = `${greeting}\nלכניסה למערכת השביל ולהשלמת פרטי ${inst.institution_name} — לחצי כאן:\n${link}`
  void sendExternal({
    phone: recipientPhone,
    whatsapp_preference: ownerProfile?.whatsapp_preference ?? true,
    waMessage: msg,
    smsMessage: msg,
  })

  return NextResponse.json({ ok: true, link })
}
