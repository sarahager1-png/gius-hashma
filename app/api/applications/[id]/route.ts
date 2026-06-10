import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendApplicationAccepted, sendApplicationRejected, sendApplicationViewedEmail } from '@/lib/email'
import { sendExternal } from '@/lib/notify-external'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)

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

  const { status, institution_notes, rejection_reason } = await request.json()
  const update: Record<string, string | null> = {}
  if (status) update.status = status
  if (institution_notes !== undefined) update.institution_notes = institution_notes
  if (status === 'נדחתה' && rejection_reason) update.rejection_reason = rejection_reason
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
      void sendApplicationViewedEmail({ candidateProfileId, jobTitle, institutionName })
    }
  }

  if (status === 'התקבלה' || status === 'נדחתה') {
    const { data: app } = await service
      .from('applications')
      .select('job_id, candidate_id, jobs(title, institutions(institution_name, profile_id)), candidates(profile_id, whatsapp_preference, profiles(full_name, phone))')
      .eq('id', id)
      .single()

    if (app) {
      const candidateProfileId = (app.candidates as unknown as { profile_id: string } | null)?.profile_id
      const candidateName = (app.candidates as unknown as { profiles: { full_name: string | null } } | null)?.profiles?.full_name ?? 'מועמדת'
      const jobTitle = (app.jobs as unknown as { title: string } | null)?.title ?? ''
      const institutionName = (app.jobs as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''
      const institutionProfileId = (app.jobs as unknown as { institutions: { profile_id: string } } | null)?.institutions?.profile_id

      if (status === 'התקבלה') {
        await Promise.all([
          service.from('jobs').update({ status: 'אוישה' }).eq('id', app.job_id),
          service.from('candidates').update({ availability_status: 'משובצת' }).eq('id', app.candidate_id),
        ])

        const { data: admins } = await service
          .from('profiles')
          .select('id, phone, whatsapp_preference')
          .in('role', ['מנהלת מערכת', 'אדמין מערכת'])
        if (admins?.length) {
          await service.from('notifications').insert(
            admins.map(a => ({
              profile_id: a.id,
              type: 'placement',
              title: `שיבוץ בוצע — ${candidateName}`,
              body: `${candidateName} שובצה למשרת "${jobTitle}" ב${institutionName}`,
              related_id: id,
            }))
          )
          const adminMsg = `✅ שיבוץ בוצע\n${candidateName} שובצה למשרת "${jobTitle}" ב${institutionName}`
          for (const admin of admins) {
            const p = (admin as unknown as { phone?: string | null; whatsapp_preference?: boolean | null })
            void sendExternal({ phone: p.phone, whatsapp_preference: p.whatsapp_preference, waMessage: adminMsg, smsMessage: adminMsg })
          }
        }

        if (candidateProfileId) {
          await service.from('notifications').insert({
            profile_id: candidateProfileId,
            type: 'application_accepted',
            title: 'ברכות! התקבלת למשרה',
            body: `אנו שמחים לבשר שהתקבלת למשרת "${jobTitle}" ב${institutionName}. נציג מהמוסד יצור איתך קשר בקרוב.`,
            related_id: id,
          })
          void sendApplicationAccepted({ candidateProfileId, candidateName, jobTitle, institutionName })
        }
        const candidatePhone = (app.candidates as unknown as { profiles: { phone: string | null } } | null)?.profiles?.phone
        const candWaPrefAccept = (app.candidates as unknown as { whatsapp_preference?: boolean | null } | null)?.whatsapp_preference
        if (candidatePhone) {
          const acceptMsg = `ברכות ${candidateName}! התקבלת למשרת "${jobTitle}" ב${institutionName}. נציג מהמוסד יצור איתך קשר בקרוב 🎉`
          void sendExternal({ phone: candidatePhone, whatsapp_preference: candWaPrefAccept, waMessage: acceptMsg, smsMessage: acceptMsg })
        }
        if (candidateProfileId && institutionProfileId) {
          void service.from('placement_surveys').insert([
            { application_id: id, survey_type: 'candidate_about_institution', respondent_profile_id: candidateProfileId },
            { application_id: id, survey_type: 'institution_about_candidate', respondent_profile_id: institutionProfileId },
          ])
        }
      } else if (status === 'נדחתה') {
        const reasonSuffix = rejection_reason ? ` סיבה: ${rejection_reason}` : ''
        if (candidateProfileId) {
          await service.from('notifications').insert({
            profile_id: candidateProfileId,
            type: 'application_rejected',
            title: 'תודה על פנייתך',
            body: `תודה רבה על עניינך ב"${jobTitle}" ב${institutionName}. לאחר בחינת המועמדויות, לצערנו לא נמצאה התאמה הפעם.${reasonSuffix}`,
            related_id: id,
          })
          void sendApplicationRejected({ candidateProfileId, candidateName, jobTitle, institutionName })
        }
        const candidatePhoneRej = (app.candidates as unknown as { profiles: { phone: string | null } } | null)?.profiles?.phone
        const candWaPref = (app.candidates as unknown as { whatsapp_preference?: boolean | null } | null)?.whatsapp_preference
        if (candidatePhoneRej) {
          const rejMsg = `שלום ${candidateName}, תודה על פנייתך למשרת "${jobTitle}" ב${institutionName}. לצערנו לא נמצאה התאמה הפעם.${reasonSuffix} בהצלחה! 🙏`
          void sendExternal({ phone: candidatePhoneRej, whatsapp_preference: candWaPref, waMessage: rejMsg, smsMessage: rejMsg })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// Delete an application — admins/institutions can delete any; candidates can withdraw when pending
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const service  = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']
  const isAdmin = ADMIN_ROLES.includes(profile.role)

  const { data: app } = await service
    .from('applications')
    .select('id, status, candidate_id, job_id, jobs(institution_id, institutions(profile_id))')
    .eq('id', id)
    .single()

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!isAdmin) {
    if (profile.role === 'מוסד') {
      const instProfileId = (app.jobs as unknown as { institutions: { profile_id: string } | null } | null)
        ?.institutions?.profile_id
      if (instProfileId !== user.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else {
      const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
      if (!cand || app.candidate_id !== cand.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      if (!['ממתינה', 'נצפתה'].includes(app.status))
        return NextResponse.json({ error: 'לא ניתן לבטל הגשה בשלב זה' }, { status: 400 })
    }
  }

  const { error } = await service.from('applications').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
