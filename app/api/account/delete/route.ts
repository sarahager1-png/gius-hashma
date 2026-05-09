import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Delete candidate row if exists
  await service.from('candidates').delete().eq('profile_id', user.id)

  // Delete institution row if exists
  await service.from('institutions').delete().eq('profile_id', user.id)

  // Delete profile row
  await service.from('profiles').delete().eq('id', user.id)

  // Delete auth user (service role required)
  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account-delete] deleteUser error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
