import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await createServiceClient()
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) return null
  return user
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerUser = await requireAdmin()
  if (!callerUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const service = createServiceClient()
  const { full_name } = await request.json()

  if (!full_name?.trim()) {
    return NextResponse.json({ error: 'שם לא יכול להיות ריק' }, { status: 400 })
  }

  const { error } = await service
    .from('profiles')
    .update({ full_name: full_name.trim() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const callerUser = await requireAdmin()
  if (!callerUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // prevent self-deletion
  if (callerUser.id === id) {
    return NextResponse.json({ error: 'לא ניתן להסיר את עצמך' }, { status: 400 })
  }

  const service = createServiceClient()

  const { count } = await service
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['מנהל רשת', 'אדמין מערכת'])

  if (!count || count <= 1) {
    return NextResponse.json({ error: 'לא ניתן להסיר את המנהל האחרון' }, { status: 400 })
  }

  const { error } = await service.from('profiles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
