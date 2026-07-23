import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWeeklySummaryEmail } from '@/lib/email'

// Vercel Cron Job — runs every Monday at 07:00 Israel time (04:00 UTC)
// Sends a weekly activity summary email to all admins + WhatsApp to network admin
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoStr = weekAgo.toISOString()
  const in7daysStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const weeklyResults = await Promise.all([
    service.from('applications').select('id', { count: 'exact', head: true })
      .gte('applied_at', weekAgoStr),
    service.from('interviews').select('id', { count: 'exact', head: true })
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in7daysStr),
    service.from('invitations').select('id', { count: 'exact', head: true })
      .eq('status', 'ממתינה'),
    service.from('applications').select('id', { count: 'exact', head: true })
      .eq('status', 'ממתינה'),
    service.from('jobs').select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgoStr),
    service.from('candidates').select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgoStr),
    service.from('institutions').select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgoStr),
  ])

  // supabase-js doesn't throw on query errors — without this check, a failed count
  // query would report as 0 and this cron would email admins a false "quiet week"
  const weeklyErr = weeklyResults.map(r => r.error).find(Boolean)
  if (weeklyErr) {
    console.error('[CRON] weekly-summary query error, aborting send:', weeklyErr)
    return NextResponse.json({ error: 'query failed, email not sent' }, { status: 500 })
  }

  const [
    { count: newApplications },
    { count: upcomingInterviews },
    { count: pendingInvitations },
    { count: pendingApplications },
    { count: newJobs },
    { count: newCandidates },
    { count: newInstitutions },
  ] = weeklyResults

  // fetch all admin profiles with their auth emails
  const { data: adminProfiles } = await service
    .from('profiles')
    .select('id, full_name')
    .in('role', ['מנהלת מערכת', 'אדמין מערכת'])

  if (!adminProfiles?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const stats = {
    newApplications: newApplications ?? 0,
    upcomingInterviews: upcomingInterviews ?? 0,
    pendingInvitations: pendingInvitations ?? 0,
    pendingApplications: pendingApplications ?? 0,
    newJobs: newJobs ?? 0,
    newCandidates: newCandidates ?? 0,
    newInstitutions: newInstitutions ?? 0,
  }

  let sent = 0
  for (const profile of adminProfiles) {
    const { data: authUser } = await service.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    try {
      await sendWeeklySummaryEmail({
        adminEmail: email,
        adminName: profile.full_name ?? 'מנהל',
        stats,
      })
      sent++
    } catch (err) {
      console.error('[CRON] weekly-summary email failed:', email, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
