import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const onlyAvailable = req.nextUrl.searchParams.get('available') === 'true'

  let q = service
    .from('interview_slots')
    .select('*, candidates(id, profiles(full_name, phone))')
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true })

  if (onlyAvailable) q = q.eq('is_available', true)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהלת מערכת', 'אדמין מערכת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { slot_date, slot_time, duration_minutes, location, meeting_link, notes } = body
  if (!slot_date || !slot_time)
    return NextResponse.json({ error: 'slot_date and slot_time are required' }, { status: 400 })

  // Support bulk creation (array of slots)
  const slots = Array.isArray(body)
    ? body
    : [{ slot_date, slot_time, duration_minutes: duration_minutes ?? 30, location, meeting_link, notes, created_by: user.id }]

  const rows = slots.map((s: Record<string, unknown>) => ({ ...s, created_by: user.id }))
  const { data, error } = await service.from('interview_slots').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
