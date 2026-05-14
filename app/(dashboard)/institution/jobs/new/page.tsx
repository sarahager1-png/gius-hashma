import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobFormClient from '@/components/institution/job-form'

interface JobTemplate {
  id: string
  title: string
  description: string | null
  specialization: string | null
  job_type: string | null
  placement_type: string | null
}

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>
}) {
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

  // Fetch templates for this institution
  const { data: templates } = await service
    .from('job_templates')
    .select('id, title, description, specialization, job_type, placement_type')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  const { duplicate } = await searchParams
  let sourceJob: Parameters<typeof JobFormClient>[0]['job'] | undefined

  if (duplicate) {
    const { data: src } = await service
      .from('jobs')
      .select('id, title, role, classes, hours, description, district, city, specialization, job_type, job_types, placement_type, expires_at, start_date, end_date')
      .eq('id', duplicate)
      .eq('institution_id', institution.id)
      .single()

    if (src) {
      sourceJob = {
        ...src,
        id: '',
        title: `${src.title} (עותק)`,
        role: src.role ?? null,
        classes: src.classes ?? null,
        hours: src.hours ?? null,
        expires_at: null,
        start_date: null,
        end_date:   null,
      }
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/institution/jobs" className="text-sm text-gray-400 hover:text-gray-600">← חזרה</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--purple)' }}>
          {sourceJob ? 'שכפול משרה' : 'פרסום משרה חדשה'}
        </h1>
        {sourceJob && (
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
            פרטי המשרה המקורית הועתקו — עדכני לפי הצורך ופרסמי
          </p>
        )}
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
        job={sourceJob}
        templates={(templates ?? []) as JobTemplate[]}
      />
    </div>
  )
}
