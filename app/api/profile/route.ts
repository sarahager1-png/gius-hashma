import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { role, full_name, phone, candidate, institution } = body

  if (!role) {
    return NextResponse.json({ error: 'role required' }, { status: 400 })
  }

  // insert profile
  const { error: profileError } = await service
    .from('profiles')
    .insert({ id: user.id, role, full_name: full_name || null, phone: phone || null })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // insert role-specific row
  if (role === 'מועמדת' && candidate) {
    const { error } = await service
      .from('candidates')
      .insert({ profile_id: user.id, ...candidate })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (role === 'מוסד' && institution) {
    const { error } = await service
      .from('institutions')
      .insert({ profile_id: user.id, ...institution })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
