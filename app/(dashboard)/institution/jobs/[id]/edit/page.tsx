import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import JobFormClient from '@/components/institution/job-form'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, city, district, principal_name, school_type, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/institution/profile')

  const { data: job } = await service
    .from('jobs')
    .select('id, title, role, classes, hours, description, district, city, specialization, job_type, job_types, placement_type, expires_at, start_date, end_date')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!job) notFound()

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/institution/jobs/${id}`}
          className="inline-flex items-center gap-2 text-[13px] font-semibold mb-3 no-underline"
          style={{ color: 'var(--purple)' }}>
          <ArrowRight size={14} />חזרה
        </Link>
        <h1 className="text-[24px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
          עריכת משרה
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>{job.title}</p>
      </div>
      <JobFormClient
        institutionId={institution.id}
        school={{
          institution_name: institution.institution_name,
          city: institution.city,
          district: institution.district,
          principal_name: institution.principal_name,
          school_type: institution.school_type,
        }}
        job={{ ...job, role: job.role ?? null, classes: job.classes ?? null, hours: job.hours ?? null }}
      />
    </div>
  )
}
