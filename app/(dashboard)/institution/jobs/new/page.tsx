import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobFormClient from '@/components/institution/job-form'

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
    .select('id, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/dashboard')

  const { duplicate } = await searchParams
  let sourceJob: Parameters<typeof JobFormClient>[0]['job'] | undefined

  if (duplicate) {
    const { data: src } = await service
      .from('jobs')
      .select('id, title, description, district, city, specialization, job_type, job_types, placement_type, expires_at, start_date, end_date')
      .eq('id', duplicate)
      .eq('institution_id', institution.id)
      .single()

    if (src) {
      sourceJob = {
        ...src,
        id: '',
        title: `${src.title} (עותק)`,
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
      <JobFormClient institutionId={institution.id} job={sourceJob} />
    </div>
  )
}
