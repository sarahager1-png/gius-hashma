import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNewApplicationEmail } from '@/lib/email'
import { smsNewApplication, smsCandidateApplicationConfirmed } from '@/lib/sms'
import { sendWA } from '@/lib/whatsapp'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, cover_letter } = await request.json()

  // derive candidate from authenticated user
  const { data: candidate } = await service
    .from('candidates')
    .select('id, profiles(full_name, phone)')
    .eq('profile_id', user.id)
    .single()

  if (!candidate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const candidate_id = candidate.id

  const { data, error } = await service
    .from('applications')
    .insert({ job_id, candidate_id, cover_letter: cover_letter ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already applied' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // fetch job details for the notification
  const { data: job } = await service
    .from('jobs')
    .select('title, city, institution_id, institutions(institution_name, profile_id, phone, whatsapp_preference)')
    .eq('id', job_id)
    .single()

  const candidateName = (candidate.profiles as unknown as { full_name: string | null } | null)?.full_name ?? 'מועמדת'
  const candidatePhone = (candidate.profiles as unknown as { phone: string | null } | null)?.phone ?? ''
  const jobTitle = (job as unknown as { title: string } | null)?.title ?? ''
  const institutionName = (job as unknown as { institutions: { institution_name: string } } | null)?.institutions?.institution_name ?? ''

  // notify all admins + the institution that owns the job
  const { data: admins } = await service
    .from('profiles')
    .select('id')
    .in('role', ['מנהלת מערכת', 'אדמין מערכת'])

  type InstFields = { profile_id: string | null; phone: string | null; whatsapp_preference: boolean | null }
  const instFields = (job as unknown as { institutions: InstFields } | null)?.institutions ?? null
  const instProfileId = instFields?.profile_id ?? null
  const instPhone = instFields?.phone ?? null
  const instWaPref = instFields?.whatsapp_preference

  const notifyIds = new Set<string>([
    ...(admins ?? []).map(a => a.id),
    ...(instProfileId ? [instProfileId] : []),
  ])

  if (notifyIds.size > 0) {
    await service.from('notifications').insert(
      [...notifyIds].map(profile_id => ({
        profile_id,
        type: 'new_application',
        title: `הגשה חדשה — ${candidateName}`,
        body: `${jobTitle}${institutionName ? ' · ' + institutionName : ''}${candidatePhone ? ' | טל: ' + candidatePhone : ''}`,
        related_id: data.id,
      }))
    )
  }

  // confirm to candidate
  await service.from('notifications').insert({
    profile_id: user.id,
    type: 'application_confirmed',
    title: 'תודה שפנית אלינו 💙',
    body: `הגשתך למשרת "${jobTitle}"${institutionName ? ' ב' + institutionName : ''} התקבלה. נעדכן אותך בכל התפתחות.`,
    related_id: data.id,
  })

  if (candidatePhone) {
    void smsCandidateApplicationConfirmed(candidatePhone, candidateName, jobTitle, institutionName).catch(() => null)
  }

  // fire-and-forget: email + SMS + WA to institution
  if (instProfileId) {
    void Promise.allSettled([
      sendNewApplicationEmail({ institutionProfileId: instProfileId, candidateName, jobTitle }),
      instPhone ? smsNewApplication(instPhone, candidateName, jobTitle) : Promise.resolve(),
      instPhone && instWaPref !== false ? sendWA(instPhone, `📋 הגשה חדשה! ${candidateName} הגישה מועמדות למשרת "${jobTitle}". לצפייה: giuus.vercel.app/institution/applications`) : Promise.resolve(),
    ])
  }

  return NextResponse.json(data, { status: 201 })
}
