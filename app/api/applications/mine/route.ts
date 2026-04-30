import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const service = createServiceClient()
  const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
  if (!cand) return NextResponse.json([])

  const { data } = await service
    .from('applications')
    .select('id, status, applied_at, cover_letter, jobs(title, city, job_type, institutions(institution_name))')
    .eq('candidate_id', cand.id)
    .order('applied_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
