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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const [profilesRes, usersRes] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, role, created_at')
      .in('role', ['מנהל רשת', 'אדמין מערכת'])
      .order('created_at', { ascending: true }),
    service.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const profiles = profilesRes.data ?? []
  const emailMap: Record<string, string> = {}
  for (const u of usersRes.data?.users ?? []) {
    emailMap[u.id] = u.email ?? ''
  }

  return NextResponse.json(
    profiles.map(p => ({
      id: p.id,
      full_name: p.full_name ?? '',
      role: p.role,
      email: emailMap[p.id] ?? '',
      created_at: p.created_at,
    }))
  )
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { email, full_name } = await request.json()

  if (!email) return NextResponse.json({ error: 'חסר אימייל' }, { status: 400 })

  const { data: usersData } = await service.auth.admin.listUsers({ perPage: 1000 })
  const found = usersData?.users.find(u => u.email === email)

  if (!found) {
    return NextResponse.json({ error: 'משתמש לא נמצא — עליו להירשם תחילה למערכת' }, { status: 404 })
  }

  const { data: existing } = await service.from('profiles').select('role').eq('id', found.id).single()
  if (existing && ['מנהל רשת', 'אדמין מערכת'].includes(existing.role)) {
    return NextResponse.json({ error: 'משתמש זה כבר מנהל מערכת' }, { status: 409 })
  }

  const name = full_name || found.email?.split('@')[0] || 'מנהל חדש'

  const { error } = await service
    .from('profiles')
    .upsert({ id: found.id, role: 'מנהל רשת', full_name: name }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
