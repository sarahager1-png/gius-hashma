import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Application, Candidate, Profile } from '@/lib/types'
import ApplicationsInboxClient from '@/components/institution/applications-inbox-client'
import Link from 'next/link'
import { ArrowRight, Pencil } from 'lucide-react'

type AppWithDetails = Application & {
  candidates: (Candidate & { profiles: Profile }) | null
}

export default async function InstitutionJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service.from('institutions').select('id').eq('profile_id', user.id).single()
  if (!institution) redirect('/dashboard')

  const { data: jobData } = await service.from('jobs').select('*').eq('id', id).eq('institution_id', institution.id).single()
  if (!jobData) notFound()

  const { data: appsData } = await service
    .from('applications')
    .select('*, candidates(*, profiles(full_name, phone))')
    .eq('job_id', id)
    .order('applied_at', { ascending: false })
  const applications = (appsData ?? []) as AppWithDetails[]

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/institution/jobs" className="inline-flex items-center gap-2 text-[13px] font-semibold mb-3"
          style={{ color: 'var(--purple)' }}>
          <ArrowRight size={14} />חזרה למשרות
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-extrabold" style={{ color: 'var(--ink)' }}>{jobData.title}</h1>
            <div className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
              {jobData.city && <span>{jobData.city} · </span>}
              {jobData.job_type && <span>{jobData.job_type} · </span>}
              {jobData.specialization}
            </div>
          </div>
          {jobData.status !== 'אוישה' && jobData.status !== 'בוטלה' && (
            <Link href={`/institution/jobs/${id}/edit`}
              className="flex items-center gap-2 h-9 px-4 rounded-[10px] border text-[13px] font-semibold no-underline transition-all shrink-0"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: '#fff' }}
              onMouseEnter={undefined}>
              <Pencil size={14} />
              עריכה
            </Link>
          )}
        </div>
      </div>

      <ApplicationsInboxClient applications={applications} jobId={id} jobStatus={jobData.status} jobTitle={jobData.title} />
    </div>
  )
}
