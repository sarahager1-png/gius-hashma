import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { institution_id, candidate_id, candidate_name, job_title, reasons, note } = await request.json()
  if (!institution_id || !candidate_id || !job_title)
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  const { data: inst } = await service
    .from('institutions').select('profile_id, institution_name').eq('id', institution_id).single()
  if (!inst) return NextResponse.json({ error: 'institution not found' }, { status: 404 })

  const { data: cand } = await service
    .from('candidates').select('id').eq('id', candidate_id).maybeSingle()
  if (!cand) return NextResponse.json({ error: 'candidate not found' }, { status: 404 })

  const reasonsText = reasons?.length > 0 ? ` · ${(reasons as string[]).join(', ')}` : ''
  const noteText = note ? ` · "${note}"` : ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

  await service.from('notifications').insert({
    profile_id: inst.profile_id,
    type: 'match_suggestion',
    title: `הצעת התאמה: ${candidate_name}`,
    body: `מנהלת המערכת מציע להזמין את ${candidate_name} למשרת "${job_title}"${reasonsText}${noteText}. לשליחת הזמנה: ${appUrl}/institution/candidates`,
    related_id: candidate_id,
  })

  return NextResponse.json({ ok: true })
}
