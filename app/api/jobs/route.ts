import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const service = createServiceClient()
  const { data } = await service
    .from('jobs')
    .select('id, title, city, institution_id, institutions(institution_name)')
    .eq('status', 'פעילה')
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { institution_id, ...rest } = body

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהל רשת', 'אדמין מערכת'].includes(profile.role)

  if (!isAdmin) {
    // institution owner: verify they own this institution and it is approved
    const { data: institution } = await service
      .from('institutions')
      .select('id, is_approved')
      .eq('id', institution_id)
      .eq('profile_id', user.id)
      .single()

    if (!institution) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!institution.is_approved) return NextResponse.json({ error: 'Not approved' }, { status: 403 })
  } else {
    // admin: verify the target institution exists
    const { data: institution } = await service
      .from('institutions')
      .select('id')
      .eq('id', institution_id)
      .single()

    if (!institution) return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
  }

  const ALLOWED_JOB_FIELDS = [
    'title', 'description', 'city', 'district', 'specialization', 'job_type',
    'placement_type', 'status', 'expires_at', 'start_date', 'end_date',
  ]
  const safeRest = Object.fromEntries(Object.entries(rest).filter(([k]) => ALLOWED_JOB_FIELDS.includes(k)))

  const { data, error } = await service
    .from('jobs')
    .insert({ institution_id, ...safeRest })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
