import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהל רשת', 'אדמין מערכת'].includes(profile.role)

  // non-admin must own the institution
  if (!isAdmin) {
    const { data: job } = await supabase
      .from('jobs')
      .select('institution_id, institutions!inner(profile_id)')
      .eq('id', id)
      .single()

    const inst = job?.institutions as unknown as { profile_id: string } | null
    if (!job || inst?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const allowed = ['title', 'description', 'district', 'city', 'specialization', 'job_type', 'placement_type', 'status', 'expires_at', 'start_date', 'end_date']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { error } = await service.from('jobs').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── automation on job status change ──
  if (update.status === 'אוישה' || update.status === 'בוטלה') {
    const { data: jobRow } = await service.from('jobs').select('title').eq('id', id).single()
    const jobTitle = jobRow?.title ?? ''

    // reject all pending/viewed applications + notify each candidate
    const { data: pendingApps } = await service
      .from('applications')
      .select('id, candidate_id, candidates(profile_id)')
      .eq('job_id', id)
      .in('status', ['ממתינה', 'נצפתה'])

    if (pendingApps && pendingApps.length > 0) {
      await service.from('applications')
        .update({ status: 'נדחתה' })
        .eq('job_id', id)
        .in('status', ['ממתינה', 'נצפתה'])

      const notifs = pendingApps
        .map(app => {
          const pid = (app.candidates as unknown as { profile_id: string } | null)?.profile_id
          if (!pid) return null
          return {
            profile_id: pid,
            type: 'application_rejected',
            title: 'תודה על פנייתך',
            body: `תודה על עניינך ב"${jobTitle}". לצערנו המשרה ${update.status === 'אוישה' ? 'אוישה' : 'בוטלה'}.`,
            related_id: app.id,
          }
        })
        .filter(Boolean)
      if (notifs.length > 0) await service.from('notifications').insert(notifs)
    }

    // if job cancelled — reset placed candidate's availability
    if (update.status === 'בוטלה') {
      const { data: placedApp } = await service
        .from('applications')
        .select('candidate_id')
        .eq('job_id', id)
        .eq('status', 'התקבלה')
        .maybeSingle()
      if (placedApp) {
        await service.from('candidates')
          .update({ availability_status: 'פתוחה להצעות' })
          .eq('id', placedApp.candidate_id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
