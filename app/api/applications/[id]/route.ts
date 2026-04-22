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

  // verify caller is the institution owner or admin
  if (!isAdmin) {
    const { data: app } = await supabase
      .from('applications')
      .select('id, jobs!inner(institution_id, institutions!inner(profile_id))')
      .eq('id', id)
      .single()

    const inst = (app?.jobs as { institutions: { profile_id: string } } | null)?.institutions
    if (!app || inst?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { status, institution_notes } = await request.json()
  const update: Record<string, string> = {}
  if (status) update.status = status
  if (institution_notes !== undefined) update.institution_notes = institution_notes

  const { error } = await service.from('applications').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
