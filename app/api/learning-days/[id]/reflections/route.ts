import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function isAdmin(role: string) {
  return ['מנהלת מערכת', 'אדמין מערכת'].includes(role)
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !isAdmin(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await service
    .from('learning_day_reflections')
    .select('*, candidates(id, profiles(id, full_name, phone))')
    .eq('learning_day_id', id)
    .order('submitted_at', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
