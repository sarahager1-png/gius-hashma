import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { APPLICATION_STATUS_COLORS } from '@/lib/constants'

export default async function MyApplicationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!candidate) redirect('/dashboard')

  const { data: applications } = await supabase
    .from('applications')
    .select('*, jobs(title, city, job_type, institutions(institution_name))')
    .eq('candidate_id', candidate.id)
    .order('applied_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>הגשות שלי</h1>

      {!applications?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">עדיין לא הגשת מועמדות</p>
          <a href="/jobs" className="text-sm font-medium" style={{ color: '#5B3AAB' }}>עיון במשרות</a>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const job = app.jobs as { title: string; city: string | null; job_type: string | null; institutions?: { institution_name: string } } | null
            const color = APPLICATION_STATUS_COLORS[app.status] ?? '#6B7280'
            return (
              <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{job?.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {job?.institutions?.institution_name}
                    {job?.city && <span> · {job.city}</span>}
                    {job?.job_type && <span> · {job.job_type}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: color + '18', color }}
                  >
                    {app.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(app.applied_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
