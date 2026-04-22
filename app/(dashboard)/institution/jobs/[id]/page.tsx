import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApplicationsInboxClient from '@/components/institution/applications-inbox-client'

export default async function InstitutionJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: institution } = await supabase
    .from('institutions')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!institution) redirect('/dashboard')

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!job) notFound()

  const { data: applications } = await supabase
    .from('applications')
    .select('*, candidates(*, profiles(full_name, phone))')
    .eq('job_id', id)
    .order('applied_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <a href="/institution/jobs" className="text-sm text-gray-400 hover:text-gray-600">← חזרה</a>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#5B3AAB' }}>{job.title}</h1>
        <div className="text-sm text-gray-500 mt-1">
          {job.city && <span>{job.city} · </span>}
          {job.job_type && <span>{job.job_type} · </span>}
          {job.specialization}
        </div>
      </div>

      <ApplicationsInboxClient applications={applications ?? []} jobId={id} jobStatus={job.status} />
    </div>
  )
}
