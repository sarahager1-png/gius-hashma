import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהל רשת', 'אדמין מערכת'].includes(profile.role)

  // non-admin must own the institution
  if (!isAdmin) {
    const { data: job } = await supabase
      .from('jobs')
      .select('institution_id, institutions!inner(profile_id)')
      .eq('id', id)
      .single()

    const inst = job?.institutions as { profile_id: string } | null
    if (!job || inst?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const allowed = ['title', 'description', 'city', 'specialization', 'job_type', 'status', 'expires_at']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { error } = await service.from('jobs').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
