import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendToCandidate, sendToMany } from '@/lib/communication'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { profile_id, profile_ids, template_key, vars, channel, wa_text, sms_text, context_type, context_id } = body

  if (!profile_id && !profile_ids?.length)
    return NextResponse.json({ error: 'profile_id or profile_ids required' }, { status: 400 })

  const opts = {
    templateKey: template_key,
    vars: vars ?? {},
    channel: channel ?? 'auto',
    waText: wa_text,
    smsText: sms_text,
    contextType: context_type,
    contextId: context_id,
    sentBy: user.id,
  }

  if (profile_ids?.length) {
    await sendToMany(profile_ids, opts)
    return NextResponse.json({ ok: true, count: profile_ids.length })
  }

  const result = await sendToCandidate({ ...opts, profileId: profile_id })
  return NextResponse.json({ ok: result !== 'failed', channel: result })
}
