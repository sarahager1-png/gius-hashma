import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendStaleApplicationsEmail } from '@/lib/email'

// Vercel Cron Job — runs daily at 08:30 Israel time (05:30 UTC)
// Alerts admins about applications pending institution review for 3+ days
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // applications still in 'ממתינה' (institution hasn't opened them) for 3+ days
  const { data: stale, error } = await service
    .from('applications')
    .select(`
      applied_at,
      jobs(title, institutions(institution_name)),
      candidates(profiles(full_name))
    `)
    .eq('status', 'ממתינה')
    .lt('applied_at', threeDaysAgo.toISOString())

  if (error) {
    console.error('[CRON] stale-applications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!stale?.length) {
    return NextResponse.json({ ok: true, stale: 0, sent: 0 })
  }

  const applications = stale.map(a => {
    const job = a.jobs as unknown as { title: string; institutions: { institution_name: string } } | null
    const candidate = a.candidates as unknown as { profiles: { full_name: string | null } } | null
    const daysOld = Math.floor((now.getTime() - new Date(a.applied_at).getTime()) / (24 * 60 * 60 * 1000))
    return {
      candidateName: candidate?.profiles?.full_name ?? 'לא ידוע',
      jobTitle: job?.title ?? 'לא ידוע',
      institutionName: job?.institutions?.institution_name ?? 'לא ידוע',
      daysOld,
    }
  }).sort((a, b) => b.daysOld - a.daysOld)

  // fetch all admin emails
  const { data: adminProfiles } = await service
    .from('profiles')
    .select('id, full_name')
    .in('role', ['מנהלת מערכת', 'אדמין מערכת'])

  let sent = 0
  for (const profile of adminProfiles ?? []) {
    const { data: authUser } = await service.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    await sendStaleApplicationsEmail({
      adminEmail: email,
      adminName: profile.full_name ?? 'מנהל',
      applications,
    })
    sent++
  }

  return NextResponse.json({ ok: true, stale: stale.length, sent })
}
