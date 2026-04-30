import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // verify caller owns this institution OR is admin
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהל רשת', 'אדמין מערכת'].includes(profile.role)

  if (!isAdmin) {
    const { data: inst } = await service.from('institutions').select('profile_id').eq('id', id).single()
    if (!inst || inst.profile_id !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const allowed = ['institution_name', 'city', 'district', 'address', 'phone', 'institution_type']
  const instUpdate = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { error } = await service.from('institutions').update(instUpdate).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // also update profile phone/name if provided
  if (body.principal_name !== undefined || body.principal_phone !== undefined) {
    const profileUpdate: Record<string, string | null> = {}
    if (body.principal_name !== undefined) profileUpdate.full_name = body.principal_name
    if (body.principal_phone !== undefined) profileUpdate.phone = body.principal_phone
    const { data: inst } = await service.from('institutions').select('profile_id').eq('id', id).single()
    if (inst) await service.from('profiles').update(profileUpdate).eq('id', inst.profile_id)
  }

  return NextResponse.json({ ok: true })
}
