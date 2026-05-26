import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: adminProfile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!adminProfile || !['מנהלת מערכת', 'אדמין מערכת'].includes(adminProfile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: inst } = await service
    .from('institutions')
    .select('id, profile_id')
    .eq('id', id)
    .single()
  if (!inst) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Unlink any institution_leads that point to this profile
  await service
    .from('institution_leads')
    .update({ registered_profile_id: null })
    .eq('registered_profile_id', inst.profile_id)

  // Delete institution (cascades to jobs, invitations, candidate_inquiries)
  await service.from('institutions').delete().eq('id', id)

  // Delete profile
  await service.from('profiles').delete().eq('id', inst.profile_id)

  // Delete auth user
  const { error } = await service.auth.admin.deleteUser(inst.profile_id)
  if (error) console.error('[institution-delete]', error)

  return NextResponse.json({ ok: true })
}
