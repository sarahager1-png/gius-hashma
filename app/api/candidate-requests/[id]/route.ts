import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode() {
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => CHARS[b % CHARS.length]).join('')
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

// PATCH — admin approves or rejects a candidate request
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action } = await request.json() // 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })

  const service = createServiceClient()

  const { data: req } = await service
    .from('candidate_requests')
    .select('*')
    .eq('id', id)
    .single()
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'reject') {
    await service.from('candidate_requests').update({ status: 'נדחתה' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  // approve: generate unique code
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await service.from('access_codes').select('id').eq('code', code).single()
    if (!existing) break
    code = genCode()
  }

  await service.from('access_codes').insert({ code, label: req.full_name })
  await service.from('candidate_requests').update({ status: 'אושרה', access_code: code }).eq('id', id)

  // Send SMS to candidate
  const smsMessage = `שלום ${req.full_name}, בקשתך אושרה!\nקוד הגישה: ${code}\nלהרשמה: ${APP_URL}/register/candidate/activate`
  const smsSent = await sendSms(req.phone, smsMessage)

  // WA fallback link (shown to admin in case SMS fails)
  const phone = req.phone.replace(/\D/g, '').replace(/^0/, '')
  const waText = encodeURIComponent(
    `שלום ${req.full_name},\nבקשתך למערכת גיוס והשמה אושרה!\n\nקוד הגישה האישי שלך: *${code}*\n\nלהרשמה: ${APP_URL}/register/candidate/activate\n\nבהצלחה!`
  )
  const waLink = `https://wa.me/972${phone}?text=${waText}`

  return NextResponse.json({ ok: true, code, smsSent, waLink })
}
