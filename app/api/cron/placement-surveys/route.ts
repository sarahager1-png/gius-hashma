import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSurveyEmail } from '@/lib/email'
import { sendWA } from '@/lib/whatsapp'
import { smsSurveyInvitation } from '@/lib/sms'

// Vercel Cron Job — runs daily
// Sends placement satisfaction survey reminders 30 days after placement.
// Surveys are created immediately on placement, so this cron only sends reminders
// for surveys that exist but haven't been submitted yet.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()

  // placement_date is stored as DATE (YYYY-MM-DD)
  const thirtyDaysAgo    = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10)
  const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 86_400_000).toISOString().slice(0, 10)

  const { data: placements, error } = await service
    .from('applications')
    .select(`
      id,
      candidates(profile_id, profiles(full_name, phone)),
      jobs(title, institutions(profile_id, institution_name, profiles(full_name, phone)))
    `)
    .eq('status', 'התקבלה')
    .gte('placement_date', thirtyOneDaysAgo)
    .lte('placement_date', thirtyDaysAgo)

  if (error) {
    console.error('[CRON] placement-surveys fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!placements?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const appIds = placements.map(p => p.id)

  // Fetch existing surveys — may have been created at placement time
  const { data: existing } = await service
    .from('placement_surveys')
    .select('application_id, survey_type, token, submitted_at')
    .in('application_id', appIds)

  // Build per-app survey map
  type SurveyEntry = { token: string; submitted: boolean }
  const surveyMap = new Map<string, { cand?: SurveyEntry; inst?: SurveyEntry }>()
  for (const s of existing ?? []) {
    const entry = surveyMap.get(s.application_id) ?? {}
    const se: SurveyEntry = { token: s.token, submitted: !!s.submitted_at }
    if (s.survey_type === 'candidate_about_institution') entry.cand = se
    else entry.inst = se
    surveyMap.set(s.application_id, entry)
  }

  let sent = 0

  for (const placement of placements) {
    const surveys = surveyMap.get(placement.id)

    // Skip if both surveys are already submitted
    if (surveys?.cand?.submitted && surveys?.inst?.submitted) continue

    const candidate = placement.candidates as unknown as {
      profile_id: string
      profiles: { full_name: string | null; phone: string | null }
    } | null

    const job = placement.jobs as unknown as {
      title: string
      institutions: {
        profile_id: string
        institution_name: string
        profiles: { full_name: string | null; phone: string | null }
      } | null
    } | null

    if (!candidate || !job?.institutions) continue

    const candidateProfileId   = candidate.profile_id
    const candidateName        = candidate.profiles?.full_name ?? 'מועמדת'
    const candidatePhone       = candidate.profiles?.phone ?? null
    const institutionProfileId = job.institutions.profile_id
    const institutionName      = job.institutions.institution_name
    const principalName        = job.institutions.profiles?.full_name ?? institutionName
    const institutionPhone     = job.institutions.profiles?.phone ?? null

    // Create any missing surveys (in case they weren't created at placement time)
    let candidateSurveyToken = surveys?.cand?.submitted ? null : surveys?.cand?.token
    let institutionSurveyToken = surveys?.inst?.submitted ? null : surveys?.inst?.token

    if (!surveys?.cand || !surveys?.inst) {
      const toInsert = []
      if (!surveys?.cand) toInsert.push({
        application_id: placement.id,
        survey_type: 'candidate_about_institution',
        respondent_profile_id: candidateProfileId,
      })
      if (!surveys?.inst) toInsert.push({
        application_id: placement.id,
        survey_type: 'institution_about_candidate',
        respondent_profile_id: institutionProfileId,
      })
      const { data: newSurveys } = await service
        .from('placement_surveys')
        .insert(toInsert)
        .select('survey_type, token')
      for (const ns of newSurveys ?? []) {
        if (ns.survey_type === 'candidate_about_institution') candidateSurveyToken = ns.token
        if (ns.survey_type === 'institution_about_candidate') institutionSurveyToken = ns.token
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

    if (candidateSurveyToken) {
      const surveyUrl = `${appUrl}/survey?t=${candidateSurveyToken}`
      const waMsg = `שלום ${candidateName.split(' ')[0]} 👋\nמילאת תפקיד ב${institutionName} לפני כחודש.\nנשמח לשמוע את חוות דעתך — שאלון קצר (2 דקות):\n${surveyUrl}`
      if (candidatePhone) {
        try { await sendWA(candidatePhone, waMsg) } catch { /* fallback */ }
      }
      try {
        await sendSurveyEmail({
          profileId: candidateProfileId,
          recipientName: candidateName,
          surveyType: 'candidate_about_institution',
          otherPartyName: institutionName,
          token: candidateSurveyToken,
        })
      } catch (err) {
        console.error('[CRON] placement-surveys email to candidate failed:', candidateProfileId, err)
      }
      if (candidatePhone) {
        try { smsSurveyInvitation(candidatePhone, candidateSurveyToken, institutionName) } catch { /* ignore */ }
      }
    }

    if (institutionSurveyToken) {
      const surveyUrl = `${appUrl}/survey?t=${institutionSurveyToken}`
      const waMsg = `שלום ${principalName.split(' ')[0]} 👋\n${candidateName} שובצה אצלכם לפני כחודש.\nנשמח לשמוע את חוות דעתכם — שאלון קצר (2 דקות):\n${surveyUrl}`
      if (institutionPhone) {
        try { await sendWA(institutionPhone, waMsg) } catch { /* fallback */ }
      }
      try {
        await sendSurveyEmail({
          profileId: institutionProfileId,
          recipientName: principalName,
          surveyType: 'institution_about_candidate',
          otherPartyName: candidateName,
          token: institutionSurveyToken,
        })
      } catch (err) {
        console.error('[CRON] placement-surveys email to institution failed:', institutionProfileId, err)
      }
      if (institutionPhone) {
        try { smsSurveyInvitation(institutionPhone, institutionSurveyToken, candidateName) } catch { /* ignore */ }
      }
    }

    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
