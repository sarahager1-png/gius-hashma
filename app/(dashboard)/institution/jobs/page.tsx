import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Job } from '@/lib/types'
import Link from 'next/link'

const PLACEMENT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  'מילוי מקום לחופשת לידה': { bg: '#FFF0F3', color: '#C2185B', icon: '👶' },
  'שיבוץ לשנה':             { bg: '#E8F5E9', color: '#2E7D32', icon: '📅' },
  'שיבוץ קבוע':             { bg: '#EDE9FE', color: '#5B3E9E', icon: '📌' },
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}

export default async function InstitutionJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution) redirect('/dashboard')
  if (!institution.is_approved) redirect('/dashboard')

  type JobWithApps = Job & { applications?: { count: number }[] }

  const { data } = await service
    .from('jobs')
    .select('*, applications(count)')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })
  const jobs = (data ?? []) as JobWithApps[]

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    'פעילה':    { bg: '#E4F6ED', color: '#1A7A4A' },
    'מושהית':   { bg: '#FDF3E3', color: 'var(--amber)' },
    'אוישה':    { bg: '#EDE9FE', color: '#5B3E9E' },
    'בוטלה':    { bg: '#F4F4F5', color: '#71717A' },
    'פג תוקפה': { bg: '#F4F4F5', color: '#71717A' },
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            המשרות שלי
          </h1>
          <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
            {institution.institution_name} · {jobs.length} משרות
          </p>
        </div>
        <Link href="/institution/jobs/new"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white"
          style={{ background: 'var(--purple)' }}>
          + משרה חדשה
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>עדיין לא פרסמת משרות</p>
          <Link href="/institution/jobs/new" className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>
            פרסמי משרה ראשונה →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const appCount = job.applications?.[0]?.count ?? 0
            const ss = STATUS_STYLE[job.status] ?? { bg: '#F4F4F5', color: '#71717A' }
            const pc = job.placement_type ? (PLACEMENT_COLORS[job.placement_type] ?? null) : null
            return (
              <Link key={job.id} href={`/institution/jobs/${job.id}`}
                className="block rounded-[16px] border overflow-hidden transition-all"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}
>
                {pc && (
                  <div className="px-5 py-2 flex items-center gap-2"
                    style={{ background: pc.bg, borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                    <span className="text-[13px]">{pc.icon}</span>
                    <span className="text-[12px] font-bold" style={{ color: pc.color }}>{job.placement_type}</span>
                    {job.start_date && (
                      <span className="ms-auto text-[12px] font-medium" style={{ color: pc.color, opacity: .75 }}>
                        מ-{fmtDate(job.start_date)}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{job.title}</p>
                    <div className="flex items-center gap-3 text-[13px]" style={{ color: 'var(--ink-3)' }}>
                      {job.city && <span>{job.city}</span>}
                      {job.job_type && <span>{job.job_type}</span>}
                      <span>{appCount} הגשות</span>
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
                      פורסם {formatDate(job.created_at)}
                      {job.start_date && !pc && (
                        <span className="me-2" style={{ color: '#1FAF6E' }}> · כניסה {fmtDate(job.start_date)}</span>
                      )}
                      {job.expires_at && (
                        <span style={{ color: new Date(job.expires_at) < new Date() ? '#DC2626' : 'var(--ink-4)' }}>
                          {' '}· תוקף עד {fmtDate(job.expires_at)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0" style={ss}>
                    {job.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
