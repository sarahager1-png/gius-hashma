import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsClient from '@/components/jobs/jobs-client'
import JobsAdminClient from '@/components/jobs/jobs-admin-client'
import type { Job } from '@/lib/types'

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { q } = await searchParams
  const isAdmin = ['מנהל רשת', 'אדמין מערכת'].includes(profile.role)

  if (isAdmin) {
    const { data: jobs } = await service
      .from('jobs')
      .select('*, institutions(institution_name, city, institution_type)')
      .order('created_at', { ascending: false })
    return <JobsAdminClient jobs={(jobs ?? []) as Job[]} initialSearch={q ?? ''} />
  }

  const { data: jobs } = await service
    .from('jobs')
    .select('*, institutions(institution_name, city, institution_type)')
    .eq('status', 'פעילה')
    .order('created_at', { ascending: false })

  const { data: candidate } = await service
    .from('candidates').select('id').eq('profile_id', user.id).single()

  const { data: myApps } = candidate
    ? await service.from('applications').select('job_id').eq('candidate_id', candidate.id)
    : { data: [] }

  const appliedJobIds = new Set((myApps ?? []).map((a: { job_id: string }) => a.job_id))

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--purple)' }}>משרות פעילות</h1>
      <JobsClient jobs={jobs ?? []} appliedJobIds={appliedJobIds} candidateId={candidate?.id ?? null} initialSearch={q ?? ''} />
    </div>
  )
}
