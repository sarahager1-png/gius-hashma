import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => chars[b % chars.length]).join('')
}

// POST — validate a code (no auth required)
export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code) return NextResponse.json({ valid: false })

  const service = createServiceClient()
  const { data } = await service
    .from('access_codes')
    .select('id, used_by')
    .eq('code', String(code).toUpperCase().trim())
    .single()

  if (!data || data.used_by) return NextResponse.json({ valid: false })
  return NextResponse.json({ valid: true })
}

// GET — list all codes (admin only)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { data } = await service
    .from('access_codes')
    .select('id, code, label, used_at, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

// PUT — create new code (admin only)
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const label: string | null = body.label || null

  const service = createServiceClient()
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await service.from('access_codes').select('id').eq('code', code).single()
    if (!existing) break
    code = genCode()
  }

  const { data, error } = await service
    .from('access_codes')
    .insert({ code, label })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE — delete a code (admin only)
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('access_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
