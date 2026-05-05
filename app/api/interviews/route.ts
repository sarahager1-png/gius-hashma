import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendInterviewScheduledEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'

// POST — admin/institution creates an interview for an application
export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)

  const { application_id, scheduled_at, location, notes } = await request.json()
  if (!application_id || !scheduled_at)
    return NextResponse.json({ error: 'application_id and scheduled_at required' }, { status: 400 })

  // fetch application to verify ownership + notification data
  const { data: app } = await service
    .from('applications')
    .select('id, candidate_id, job_id, jobs(title, institution_id, institutions(institution_name, profile_id)), candidates(profile_id, profiles(full_name, phone))')
    .eq('id', application_id)
    .single()

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // non-admin: must own the institution that posted the job
  if (!isAdmin) {
    const instProfileId = (app.jobs as unknown as { institutions: { profile_id: string } } | null)?.institutions?.profile_id
    if (instProfileId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data: interview, error } = await service
    .from('interviews')
    .insert({ application_id, scheduled_at, location: location || null, notes: notes || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify candidate (in-app + email + SMS)
  const candidateProfileId = (app.candidates as unknown as { profile_id: string } | null)?.profile_id
  const candidateName = (app.candidates as unknown as { profiles: { full_name: string | null } } | null)?.profiles?.full_name ?? 'מועמדת'
  const candidatePhone = (app.candidates as unknown as { profiles: { phone: string | null } } | null)?.profiles?.phone
  const institutionName = (app.jobs as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''
  const jobTitle = (app.jobs as unknown as { title: string } | null)?.title ?? ''

  if (candidateProfileId) {
    const dt = new Date(scheduled_at).toLocaleString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    await service.from('notifications').insert({
      profile_id: candidateProfileId,
      type: 'interview_scheduled',
      title: 'הוזמנת לראיון',
      body: `${institutionName} — ${jobTitle}. תאריך: ${dt}${location ? '. מיקום: ' + location : ''}`,
      related_id: interview.id,
    })
    void sendInterviewScheduledEmail({ candidateProfileId, candidateName, jobTitle, institutionName, scheduledAt: scheduled_at, location })
  }
  if (candidatePhone) {
    const dtSms = new Date(scheduled_at).toLocaleString('he-IL', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
    void sendSms(candidatePhone, `שלום ${candidateName}! ראיון נקבע — ${institutionName} · "${jobTitle}". תאריך: ${dtSms}${location ? '. מיקום: ' + location : ''}. בהצלחה! 🌟`)
  }

  return NextResponse.json(interview, { status: 201 })
}
