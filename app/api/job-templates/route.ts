import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET — list templates for current institution
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!institution) return NextResponse.json([], { status: 200 })

  const { data } = await service
    .from('job_templates')
    .select('*')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

// POST — create a template
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!institution) return NextResponse.json({ error: 'No institution' }, { status: 403 })

  const body = await request.json()
  const { title, description, specialization, job_type, placement_type } = body

  if (!title?.trim()) return NextResponse.json({ error: 'כותרת חובה' }, { status: 400 })

  const { data, error } = await service
    .from('job_templates')
    .insert({
      institution_id: institution.id,
      title: title.trim(),
      description: description?.trim() || null,
      specialization: specialization || null,
      job_type: job_type || null,
      placement_type: placement_type || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

// DELETE — delete a template by id (query param: ?id=)
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const service = createServiceClient()
  const { data: institution } = await service
    .from('institutions')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!institution) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await service
    .from('job_templates')
    .delete()
    .eq('id', id)
    .eq('institution_id', institution.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
