import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'
import { sendExternal } from '@/lib/notify-external'

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, city, phone, level, status, placement_location, prev_employer, prev_role, exp } = await request.json()

  const { data: newProfile, error: pe } = await service
    .from('profiles').insert({ role: 'מועמדת', full_name: name, phone: phone || null }).select().single()
  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })

  const { data: newCand, error: ce } = await service
    .from('candidates').insert({
      profile_id: newProfile.id, city: city || null,
      academic_level: level, availability_status: status, specialization: 'יסודי',
      placement_location: placement_location || null,
      prev_employer: prev_employer || null, prev_role: prev_role || null,
      years_experience: exp ? parseInt(exp) : null,
    }).select().single()
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  void notifyMatchingInstitutions(service, newCand.id, newProfile.id, name, 'יסודי', null, city || null)

  return NextResponse.json({ ok: true, id: newCand.id }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { profile, candidate } = await request.json()

  if (profile) {
    const { error } = await service
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const MATCH_FIELDS = ['specialization', 'district', 'city']
  const matchChanged = candidate && MATCH_FIELDS.some(f => f in candidate)

  if (candidate) {
    const ALLOWED = [
      'city', 'college', 'graduation_year', 'specialization', 'academic_level',
      'availability_status', 'bio', 'district', 'address', 'birth_year',
      'marital_status', 'maiden_name', 'seniority_years', 'handwriting_font',
      'technical_skills', 'interpersonal_skills', 'special_skills',
      'experiences', 'practical_work',
      'shlichut_location', 'shlichut_years', 'past_projects', 'personal_note',
      'availability_from', 'availability_to', 'study_day',
      'years_experience', 'prev_employer', 'prev_role', 'whatsapp_preference',
    ]
    const safe = Object.fromEntries(Object.entries(candidate).filter(([k]) => ALLOWED.includes(k)))
    if (Object.keys(safe).length > 0) {
      const { error } = await service.from('candidates').update(safe).eq('profile_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Notify matching institutions when key fields changed
  if (matchChanged) {
    const { data: cand } = await service
      .from('candidates')
      .select('id, specialization, district, city, profiles(full_name)')
      .eq('profile_id', user.id)
      .single()
    if (cand) {
      const name = (cand.profiles as unknown as { full_name: string | null } | null)?.full_name ?? ''
      void notifyMatchingInstitutions(service, cand.id, user.id, name, cand.specialization, cand.district, cand.city)
    }
  }

  return NextResponse.json({ ok: true })
}

async function notifyMatchingInstitutions(
  service: ReturnType<typeof createServiceClient>,
  candidateId: string,
  candidateProfileId: string,
  candidateName: string,
  specialization: string | null,
  district: string | null,
  city: string | null,
) {
  // Build OR filter for active jobs matching any of the candidate's key fields
  const filters: string[] = []
  if (specialization) filters.push(`specialization.eq.${specialization}`)
  if (district)       filters.push(`district.eq.${district}`)
  if (city)           filters.push(`city.eq.${city}`)
  if (!filters.length) return

  const { data: jobs } = await service
    .from('jobs')
    .select('id, title, institution_id, institutions(profile_id, institution_name, whatsapp_preference, profiles(phone))')
    .eq('status', 'פעילה')
    .or(filters.join(','))
    .limit(50)

  if (!jobs?.length) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

  // Notify institutions (one per institution, deduped)
  const seenInst = new Set<string>()
  for (const job of jobs) {
    const inst = job.institutions as unknown as {
      profile_id: string
      institution_name: string
      whatsapp_preference: boolean | null
      profiles: { phone: string | null } | null
    } | null
    if (!inst || seenInst.has(inst.profile_id)) continue
    seenInst.add(inst.profile_id)

    const desc = [candidateName, specialization, city].filter(Boolean).join(' · ')

    void notify({
      profile_id: inst.profile_id,
      type: 'new_match',
      title: '✨ מועמדת חדשה מתאימה',
      body: desc,
      url: `/candidates/${candidateId}`,
    })

    const phone = inst.profiles?.phone
    void sendExternal({
      phone,
      whatsapp_preference: inst.whatsapp_preference,
      waMessage:  `✨ מועמדת חדשה שעשויה להתאים למשרה שלכם:\n${desc}\nלצפייה: ${appUrl}/candidates/${candidateId}`,
      smsMessage: `✨ מועמדת חדשה מתאימה: ${desc}. לצפייה: ${appUrl}/candidates/${candidateId}`,
    })
  }

  // Notify candidate — group all matching jobs into one message
  const matchingJobs = jobs.map(j => {
    const inst = j.institutions as unknown as { institution_name: string } | null
    return { id: j.id, title: j.title as string, institutionName: inst?.institution_name ?? '' }
  })
  if (!matchingJobs.length) return

  const { data: candProfile } = await service
    .from('candidates')
    .select('profiles(phone, whatsapp_preference)')
    .eq('id', candidateId)
    .single()
  const cp = (candProfile?.profiles as unknown as { phone: string | null; whatsapp_preference: boolean | null } | null)

  if (matchingJobs.length === 1) {
    const m = matchingJobs[0]
    void notify({
      profile_id: candidateProfileId,
      type: 'new_match',
      title: '✨ נמצאה משרה מתאימה לפרופיל שלך',
      body: `${m.title} ב${m.institutionName}`,
      url: `/jobs/${m.id}`,
    })
    void sendExternal({
      phone: cp?.phone ?? null,
      whatsapp_preference: cp?.whatsapp_preference ?? null,
      waMessage:  `✨ נמצאה משרה מתאימה לפרופיל שלך:\n${m.title} ב${m.institutionName}\nלצפייה: ${appUrl}/jobs/${m.id}`,
      smsMessage: `✨ נמצאה משרה מתאימה: ${m.title} ב${m.institutionName}. ${appUrl}/jobs/${m.id}`,
    })
  } else {
    const titles = matchingJobs.slice(0, 3).map(m => `• ${m.title} ב${m.institutionName}`).join('\n')
    const extra = matchingJobs.length > 3 ? `\nועוד ${matchingJobs.length - 3} משרות נוספות` : ''
    void notify({
      profile_id: candidateProfileId,
      type: 'new_match',
      title: `✨ נמצאו ${matchingJobs.length} משרות מתאימות לפרופיל שלך`,
      body: matchingJobs.slice(0, 2).map(m => `${m.title} ב${m.institutionName}`).join(' | '),
      url: `/jobs`,
    })
    void sendExternal({
      phone: cp?.phone ?? null,
      whatsapp_preference: cp?.whatsapp_preference ?? null,
      waMessage:  `✨ נמצאו ${matchingJobs.length} משרות מתאימות לפרופיל שלך:\n${titles}${extra}\nלצפייה: ${appUrl}/jobs`,
      smsMessage: `✨ נמצאו ${matchingJobs.length} משרות מתאימות לפרופיל שלך. לצפייה: ${appUrl}/jobs`,
    })
  }
}
