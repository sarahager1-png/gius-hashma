import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, city, type, principal, phone, address } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'שם מוסד חובה' }, { status: 400 })

  // Create a placeholder auth user so the profile FK is satisfied
  const dummyEmail = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@giuus-admin.internal`
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: dummyEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { admin_created: true },
  })
  if (authError || !authData.user)
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })

  const { data: newProfile, error: pe } = await service
    .from('profiles')
    .insert({ id: authData.user.id, role: 'מוסד', full_name: principal || null, phone: phone || null })
    .select().single()
  if (pe) {
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: pe.message }, { status: 500 })
  }

  const { data: newInst, error: ie } = await service
    .from('institutions').insert({
      profile_id: newProfile.id,
      institution_name: name.trim(),
      city: city || null,
      institution_type: type || null,
      phone: phone || null,
      address: address || null,
      is_approved: true,
    }).select().single()
  if (ie) {
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: ie.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: newInst.id }, { status: 201 })
}
