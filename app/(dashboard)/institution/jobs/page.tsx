import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { JOB_STATUS_COLORS } from '@/lib/constants'

export default async function InstitutionJobsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, institution_name, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution) redirect('/dashboard')
  if (!institution.is_approved) redirect('/dashboard')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, applications(count)')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#5B3AAB' }}>המשרות שלי</h1>
        <a
          href="/institution/jobs/new"
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: '#00B4CC' }}
        >
          + משרה חדשה
        </a>
      </div>

      {!jobs?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">עדיין לא פרסמת משרות</p>
          <a href="/institution/jobs/new" className="text-sm font-medium" style={{ color: '#00B4CC' }}>
            פרסמי משרה ראשונה
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const appCount = (job.applications as { count: number }[] | null)?.[0]?.count ?? 0
            const color = JOB_STATUS_COLORS[job.status] ?? '#6B7280'
            return (
              <a
                key={job.id}
                href={`/institution/jobs/${job.id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{job.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {job.city && <span>{job.city} · </span>}
                      {job.job_type && <span>{job.job_type} · </span>}
                      {job.specialization}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: color + '18', color }}
                    >
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-400">{appCount} הגשות</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">{formatDate(job.created_at)}</div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
