import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH — mark as read
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  await service
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('to_profile_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ ok: true })
}
