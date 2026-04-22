import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsClient from '@/components/jobs/jobs-client'

export default async function JobsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, institutions(institution_name, city, institution_type)')
    .eq('status', 'פעילה')
    .order('created_at', { ascending: false })

  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  const { data: myApps } = candidate
    ? await supabase
        .from('applications')
        .select('job_id')
        .eq('candidate_id', candidate.id)
    : { data: [] }

  const appliedJobIds = new Set((myApps ?? []).map((a: { job_id: string }) => a.job_id))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>משרות פעילות</h1>
      <JobsClient jobs={jobs ?? []} appliedJobIds={appliedJobIds} candidateId={candidate?.id ?? null} />
    </div>
  )
}
