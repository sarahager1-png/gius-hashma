import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, candidate_id, cover_letter } = await request.json()

  // verify candidate_id belongs to caller
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('id', candidate_id)
    .eq('profile_id', user.id)
    .single()

  if (!candidate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await service
    .from('applications')
    .insert({ job_id, candidate_id, cover_letter: cover_letter ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already applied' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
