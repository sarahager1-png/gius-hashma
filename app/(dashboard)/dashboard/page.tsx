import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role

  if (role === 'מועמדת') {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'פעילה')

    const { count: appCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidate?.id ?? '')

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>ברוכה הבאה</h1>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <StatCard label="משרות פעילות" value={jobsCount ?? 0} color="#5B3AAB" />
          <StatCard label="הגשות שלי" value={appCount ?? 0} color="#00B4CC" />
        </div>
        <div className="mt-8">
          <a href="/jobs" className="inline-block px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#5B3AAB' }}>
            עיון במשרות
          </a>
        </div>
      </div>
    )
  }

  if (role === 'מוסד') {
    const { data: institution } = await supabase
      .from('institutions')
      .select('id, is_approved, institution_name')
      .eq('profile_id', user.id)
      .single()

    if (!institution?.is_approved) {
      return (
        <div className="p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-md">
            <h2 className="font-semibold text-amber-800 text-lg mb-2">ממתין לאישור</h2>
            <p className="text-amber-700 text-sm">
              חשבון המוסד שלך ממתין לאישור מנהל הרשת. לאחר האישור תוכלי לפרסם משרות ולגשת למאגר המועמדות.
            </p>
          </div>
        </div>
      )
    }

    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institution.id)
      .eq('status', 'פעילה')

    const { count: pendingApps } = await supabase
      .from('applications')
      .select('jobs!inner(institution_id)', { count: 'exact', head: true })
      .eq('jobs.institution_id', institution.id)
      .eq('status', 'ממתינה')

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#5B3AAB' }}>{institution.institution_name}</h1>
        <div className="grid grid-cols-2 gap-4 max-w-md mb-8">
          <StatCard label="משרות פעילות" value={jobsCount ?? 0} color="#5B3AAB" />
          <StatCard label="הגשות ממתינות" value={pendingApps ?? 0} color="#C9A84C" />
        </div>
        <a href="/institution/jobs/new" className="inline-block px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#00B4CC' }}>
          + פרסמי משרה חדשה
        </a>
      </div>
    )
  }

  // admin / מנהל רשת
  const [
    { count: candidateCount },
    { count: institutionCount },
    { count: pendingInstitutions },
    { count: activeJobs },
  ] = await Promise.all([
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('institutions').select('*', { count: 'exact', head: true }),
    supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'פעילה'),
  ])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>דשבורד מטה</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="מועמדות" value={candidateCount ?? 0} color="#5B3AAB" />
        <StatCard label="מוסדות" value={institutionCount ?? 0} color="#00B4CC" />
        <StatCard label="ממתינים לאישור" value={pendingInstitutions ?? 0} color="#C9A84C" />
        <StatCard label="משרות פעילות" value={activeJobs ?? 0} color="#15803D" />
      </div>
      {(pendingInstitutions ?? 0) > 0 && (
        <div className="mt-6">
          <a href="/admin/institutions" className="inline-block px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#C9A84C' }}>
            אשרי מוסדות ({pendingInstitutions})
          </a>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
