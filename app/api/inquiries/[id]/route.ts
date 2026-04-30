import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH — institution marks seen / replies; candidate can view own inquiry
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service
    .from('profiles').select('role').eq('id', user.id).single()

  // fetch inquiry so we can verify ownership
  const { data: inquiry } = await service
    .from('candidate_inquiries')
    .select('*, institutions(profile_id), candidates(profile_id)')
    .eq('id', id)
    .single()
  if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = profile?.role && ['מנהל רשת', 'אדמין מערכת'].includes(profile.role)
  const isOwningInst = (inquiry.institutions as any)?.profile_id === user.id
  if (!isAdmin && !isOwningInst)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { status, institution_reply } = body

  const patch: Record<string, unknown> = {}
  if (status) patch.status = status
  if (institution_reply !== undefined) {
    patch.institution_reply = institution_reply || null
    if (institution_reply?.trim()) {
      patch.status = 'נענתה'
      patch.replied_at = new Date().toISOString()
    }
  }

  const { data: updated, error } = await service
    .from('candidate_inquiries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify candidate when institution replies
  if (institution_reply?.trim()) {
    const candidateProfileId = (inquiry.candidates as any)?.profile_id
    if (candidateProfileId) {
      await service.from('notifications').insert({
        profile_id: candidateProfileId,
        type: 'inquiry_reply',
        title: 'קיבלת תגובה לפנייתך',
        body: institution_reply.trim().slice(0, 100),
        related_id: id,
      })
    }
  }

  return NextResponse.json(updated)
}
