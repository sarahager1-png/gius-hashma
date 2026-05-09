import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'

// GET — inbox: messages sent to me, newest first
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data, error } = await service
    .from('messages')
    .select(`
      id, subject, body, read_at, created_at, related_job_id,
      from_profile_id,
      from_profile:profiles!messages_from_profile_id_fkey(full_name),
      jobs(title)
    `)
    .eq('to_profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — send a message
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to_profile_id, subject, body, related_job_id } = await request.json()

  if (!to_profile_id || !body?.trim())
    return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })

  const service = createServiceClient()

  const { data, error } = await service
    .from('messages')
    .insert({
      from_profile_id: user.id,
      to_profile_id,
      subject: subject?.trim() || null,
      body: body.trim(),
      related_job_id: related_job_id || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify recipient via in-app + web push
  const { data: sender } = await service.from('profiles').select('full_name').eq('id', user.id).single()
  void notify({
    profile_id: to_profile_id,
    type: 'message',
    title: `הודעה חדשה מ-${sender?.full_name ?? 'משתמש'}`,
    body: body.trim().substring(0, 100),
    related_id: data.id,
    url: '/inbox',
  })

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
