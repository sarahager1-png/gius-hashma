import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWA } from '@/lib/whatsapp'
import { sendSms } from '@/lib/sms'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { message } = await request.json()
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const { data: institutions } = await service
    .from('institutions')
    .select('id, institution_name, phone, whatsapp_preference')
    .eq('is_approved', true)
    .not('phone', 'is', null)

  let sent = 0
  for (const inst of institutions ?? []) {
    if (!inst.phone) continue
    try {
      if (inst.whatsapp_preference !== false) {
        await sendWA(inst.phone, message)
      } else {
        await sendSms(inst.phone, message)
      }
      sent++
    } catch { /* continue on individual failures */ }
  }

  return NextResponse.json({ ok: true, sent })
}
