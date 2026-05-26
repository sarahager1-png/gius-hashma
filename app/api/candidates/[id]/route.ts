import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !ADMIN_ROLES.includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: candidate } = await service
    .from('candidates')
    .select('id, profile_id')
    .eq('id', id)
    .single()

  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete dependent records first
  await service.from('applications').delete().eq('candidate_id', id)
  await service.from('invitations').delete().eq('candidate_id', id)
  await service.from('candidate_inquiries').delete().eq('candidate_id', id)

  const { error: candErr } = await service.from('candidates').delete().eq('id', id)
  if (candErr) return NextResponse.json({ error: candErr.message }, { status: 500 })

  await service.from('profiles').delete().eq('id', candidate.profile_id)
  // Delete the auth user so they cannot log in again and trigger recreation of profile+candidate
  await service.auth.admin.deleteUser(candidate.profile_id)

  return NextResponse.json({ ok: true })
}
