import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNewJobMatchEmail } from '@/lib/email'
import { sendExternal } from '@/lib/notify-external'

export async function GET() {
  const service = createServiceClient()
  const { data } = await service
    .from('jobs')
    .select('id, title, city, institution_id, institutions(institution_name)')
    .eq('status', 'פעילה')
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { institution_id, ...rest } = body

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role && ['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)

  if (!isAdmin) {
    // institution owner: verify they own this institution and it is approved
    const { data: institution } = await service
      .from('institutions')
      .select('id, is_approved')
      .eq('id', institution_id)
      .eq('profile_id', user.id)
      .single()

    if (!institution) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!institution.is_approved) return NextResponse.json({ error: 'Not approved' }, { status: 403 })
  } else {
    // admin: verify the target institution exists
    const { data: institution } = await service
      .from('institutions')
      .select('id')
      .eq('id', institution_id)
      .single()

    if (!institution) return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
  }

  const ALLOWED_JOB_FIELDS = [
    'title', 'description', 'city', 'district', 'specialization', 'job_type', 'job_types',
    'placement_type', 'status', 'expires_at', 'start_date', 'end_date',
  ]
  const safeRest = Object.fromEntries(Object.entries(rest).filter(([k]) => ALLOWED_JOB_FIELDS.includes(k)))

  const { data, error } = await service
    .from('jobs')
    .insert({ institution_id, ...safeRest })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify matching candidates asynchronously (don't await — don't block response)
  notifyMatchingCandidates(service, data).catch(e =>
    console.error('[JOBS] notifyMatchingCandidates error:', e)
  )

  return NextResponse.json(data, { status: 201 })
}

async function notifyMatchingCandidates(
  service: ReturnType<typeof createServiceClient>,
  job: { id: string; title: string; city: string | null; specialization: string | null; institution_id: string }
) {
  // find active candidates matching specialization (or 'שניהם') and not already placed
  let query = service
    .from('candidates')
    .select('profile_id, city, specialization, whatsapp_preference, profiles(full_name, phone)')
    .not('availability_status', 'in', '("משובצת","לא פעילה")')

  if (job.specialization && job.specialization !== 'שניהם') {
    query = query.in('specialization', [job.specialization, 'שניהם'])
  }

  const { data: candidates } = await query

  if (!candidates?.length) return

  // get institution name
  const { data: institution } = await service
    .from('institutions')
    .select('institution_name')
    .eq('id', job.institution_id)
    .single()

  const institutionName = institution?.institution_name ?? ''
  const city = job.city ?? ''

  // cap at 50 notifications to avoid spam on large candidate pools
  const targets = candidates.slice(0, 50)

  for (const c of targets) {
    const candidate = c as unknown as {
      profile_id: string
      city: string | null
      whatsapp_preference: boolean | null
      profiles: { full_name: string | null; phone: string | null }
    }

    const profileId = candidate.profile_id
    const name = candidate.profiles?.full_name ?? 'מועמדת'
    const phone = candidate.profiles?.phone

    void service.from('notifications').insert({
      profile_id: profileId,
      type: 'match_suggestion',
      title: `משרה חדשה מתאימה — ${job.title}`,
      body: `${institutionName}${city ? ' · ' + city : ''}`,
      related_id: job.id,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'giuus.vercel.app'
    await sendExternal({
      phone,
      whatsapp_preference: candidate.whatsapp_preference,
      waMessage:  `✨ משרה חדשה מתאימה לך!\n*${job.title}* — ${institutionName}${city ? ` · ${city}` : ''}\nלצפייה ולהגשה: ${appUrl}/jobs/${job.id}`,
      smsMessage: `✨ משרה חדשה מתאימה! "${job.title}" ב-${institutionName}${city ? `, ${city}` : ''}. לצפייה: ${appUrl}/jobs/${job.id}`,
      emailFallback: () => sendNewJobMatchEmail({
        candidateProfileId: profileId,
        candidateName: name,
        jobTitle: job.title,
        institutionName,
        city,
        jobId: job.id,
      }),
    })
  }
}
