import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/server-utils'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await assertAdmin(supabase, user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await service
    .from('institutions')
    .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: inst } = await service
    .from('institutions')
    .select('institution_name, phone, profiles(full_name, phone)')
    .eq('id', id)
    .single()

  const name = inst?.institution_name ?? ''
  const profilePhone = (inst?.profiles as unknown as { phone: string | null } | null)?.phone ?? ''
  const phone = inst?.phone ?? profilePhone

  return NextResponse.json({ ok: true, name, phone })
}
