import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { job_id, candidate_id } = body
  if (!job_id || !candidate_id) {
    return NextResponse.json({ error: 'Missing job_id or candidate_id' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions')
    .select('id, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await service
    .from('match_dismissals')
    .upsert(
      { institution_id: institution.id, candidate_id, job_id },
      { onConflict: 'institution_id,candidate_id,job_id', ignoreDuplicates: true }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
