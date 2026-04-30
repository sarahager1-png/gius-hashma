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

  // verify caller is the institution owner or admin
  if (!isAdmin) {
    const { data: app } = await supabase
      .from('applications')
      .select('id, jobs!inner(institution_id, institutions!inner(profile_id))')
      .eq('id', id)
      .single()

    const inst = (app?.jobs as unknown as { institutions: { profile_id: string } } | null)?.institutions
    if (!app || inst?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { status, institution_notes } = await request.json()
  const update: Record<string, string | null> = {}
  if (status) update.status = status
  if (institution_notes !== undefined) update.institution_notes = institution_notes
  if (status === 'התקבלה') update.placement_date = new Date().toISOString().slice(0, 10)

  const { error } = await service.from('applications').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── automation on status change ──
  if (status === 'נצפתה') {
    const { data: app } = await service
      .from('applications')
      .select('jobs(title, institutions(institution_name)), candidates(profile_id)')
      .eq('id', id)
      .single()
    const candidateProfileId = (app?.candidates as unknown as { profile_id: string } | null)?.profile_id
    const jobTitle = (app?.jobs as unknown as { title: string } | null)?.title ?? ''
    const institutionName = (app?.jobs as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''
    if (candidateProfileId) {
      await service.from('notifications').insert({
        profile_id: candidateProfileId,
        type: 'application_viewed',
        title: 'ההגשה שלך נצפתה',
        body: `${institutionName} עיינ${institutionName ? 'ה' : 'ו'} בהגשתך למשרת "${jobTitle}"`,
        related_id: id,
      })
    }
  }

  if (status === 'התקבלה' || status === 'נדחתה') {
    // fetch application details for automation + notification
    const { data: app } = await service
      .from('applications')
      .select('job_id, candidate_id, jobs(title, institutions(institution_name)), candidates(profile_id, profiles(full_name, phone))')
      .eq('id', id)
      .single()

    if (app) {
      const candidateProfileId = (app.candidates as unknown as { profile_id: string } | null)?.profile_id
      const candidateName = (app.candidates as unknown as { profiles: { full_name: string | null } } | null)?.profiles?.full_name ?? 'מועמדת'
      const jobTitle = (app.jobs as unknown as { title: string } | null)?.title ?? ''
      const institutionName = (app.jobs as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''

      if (status === 'התקבלה') {
        // mark job as filled + candidate as placed
        await Promise.all([
          service.from('jobs').update({ status: 'אוישה' }).eq('id', app.job_id),
          service.from('candidates').update({ availability_status: 'משובצת' }).eq('id', app.candidate_id),
        ])

        // notify candidate
        if (candidateProfileId) {
          await service.from('notifications').insert({
            profile_id: candidateProfileId,
            type: 'application_accepted',
            title: 'ברכות! התקבלת למשרה',
            body: `אנו שמחים לבשר שהתקבלת למשרת "${jobTitle}" ב${institutionName}. נציג מהמוסד יצור איתך קשר בקרוב.`,
            related_id: id,
          })
        }
      } else if (status === 'נדחתה') {
        // respectful rejection notification for candidate
        if (candidateProfileId) {
          const candidatePhone = (app.candidates as unknown as { profiles: { phone: string | null } } | null)?.profiles?.phone ?? ''
          await service.from('notifications').insert({
            profile_id: candidateProfileId,
            type: 'application_rejected',
            title: 'תודה על פנייתך',
            body: `תודה רבה על עניינך ב"${jobTitle}" ב${institutionName}. לאחר בחינת המועמדויות, לצערנו לא נמצאה התאמה הפעם. אנו מאחלים לך הצלחה רבה בהמשך הדרך!`,
            related_id: id,
          })
          // Generate WhatsApp rejection link for admin to send manually
          void candidatePhone // available if admin wants to send via WA
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// Candidate withdraws their own application (only when status is ממתינה or נצפתה)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
  if (!cand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: app } = await service
    .from('applications').select('id, status, candidate_id').eq('id', id).single()

  if (!app || app.candidate_id !== cand.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!['ממתינה', 'נצפתה'].includes(app.status))
    return NextResponse.json({ error: 'לא ניתן לבטל הגשה בשלב זה' }, { status: 400 })

  const { error } = await service.from('applications').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
