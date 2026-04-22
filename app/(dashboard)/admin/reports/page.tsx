import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const [
    { data: appsByStatus },
    { data: jobsBySpec },
    { data: candidatesByStatus },
  ] = await Promise.all([
    supabase.rpc('count_applications_by_status').select(),
    supabase.from('jobs').select('specialization, status'),
    supabase.from('candidates').select('availability_status'),
  ])

  // Compute distributions client-side from raw data
  const appDist = groupCount((appsByStatus ?? []) as { status: string }[], 'status')
  const jobSpecDist = groupCount(
    ((jobsBySpec ?? []) as { specialization: string | null }[]).filter(j => j.specialization),
    'specialization' as keyof { specialization: string | null }
  )
  const candStatusDist = groupCount((candidatesByStatus ?? []) as { availability_status: string }[], 'availability_status')

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#5B3AAB' }}>דוחות</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportTable title="הגשות לפי סטטוס" rows={appDist} color="#5B3AAB" />
        <ReportTable title="משרות לפי התמחות" rows={jobSpecDist} color="#00B4CC" />
        <ReportTable title="מועמדות לפי זמינות" rows={candStatusDist} color="#C9A84C" />
      </div>
    </div>
  )
}

function groupCount<T>(arr: T[], key: keyof T): { label: string; count: number }[] {
  const map: Record<string, number> = {}
  for (const item of arr) {
    const val = String(item[key] ?? '—')
    map[val] = (map[val] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function ReportTable({ title, rows, color }: { title: string; rows: { label: string; count: number }[]; color: string }) {
  const total = rows.reduce((s, r) => s + r.count, 0)
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">אין נתונים</p>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{r.label}</span>
                  <span className="text-gray-400">{r.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${total ? (r.count / total) * 100 : 0}%`, background: color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
