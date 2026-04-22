import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // verify caller is the institution owner
  const body = await request.json()
  const { institution_id, ...rest } = body

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, is_approved')
    .eq('id', institution_id)
    .eq('profile_id', user.id)
    .single()

  if (!institution) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!institution.is_approved) return NextResponse.json({ error: 'Not approved' }, { status: 403 })

  const { data, error } = await service
    .from('jobs')
    .insert({ institution_id, ...rest })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
