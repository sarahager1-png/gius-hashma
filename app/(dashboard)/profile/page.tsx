import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Briefcase, CheckCircle, Eye, XCircle, Clock } from 'lucide-react'
import ProfileFormClient from './profile-form-client'
import StatusWidget from './status-widget'

const APP_STATUS_CFG: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  'ממתינה': { bg: '#EDE9FE', color: '#5B21B6', icon: <Clock size={12} /> },
  'נצפתה':  { bg: '#E0F2FE', color: '#0369A1', icon: <Eye size={12} /> },
  'התקבלה': { bg: '#DCFCE7', color: '#166534', icon: <CheckCircle size={12} /> },
  'נדחתה':  { bg: '#FEE2E2', color: '#B91C1C', icon: <XCircle size={12} /> },
  'בוטלה':  { bg: '#F4F4F5', color: '#71717A', icon: <XCircle size={12} /> },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'מועמדת') redirect('/dashboard')

  const { data: candidate } = await service
    .from('candidates').select('*').eq('profile_id', user.id).single()

  // fetch recent applications with job + institution info
  const { data: appsRaw } = candidate
    ? await service
        .from('applications')
        .select('id, status, applied_at, jobs(title, city, institutions(institution_name))')
        .eq('candidate_id', candidate.id)
        .order('applied_at', { ascending: false })
        .limit(12)
    : { data: [] }

  const apps = (appsRaw ?? []) as unknown as Array<{
    id: string; status: string; applied_at: string;
    jobs: { title: string; city: string | null; institutions: { institution_name: string } | null } | null
  }>

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      {/* Placed status banner */}
      {candidate?.availability_status && (
        <StatusWidget status={candidate.availability_status} />
      )}

      <h1 className="page-title mb-1">הפרופיל שלי</h1>
      <span className="brand-line mb-6 block" />

      <ProfileFormClient profile={profile} candidate={candidate} />

      {/* Applications history */}
      {apps.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
              היסטוריית הגשות
            </h2>
            <Link href="/my-applications"
              className="text-[13px] font-semibold"
              style={{ color: 'var(--purple)' }}>
              כל ההגשות ←
            </Link>
          </div>

          <div className="space-y-2">
            {apps.map(app => {
              const cfg = APP_STATUS_CFG[app.status] ?? APP_STATUS_CFG['בוטלה']
              const job = app.jobs as typeof app.jobs
              return (
                <div key={app.id}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-[12px]"
                  style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--purple-050)' }}>
                    <Briefcase size={15} style={{ color: 'var(--purple)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold truncate" style={{ color: 'var(--ink)' }}>
                      {job?.title ?? '—'}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: 'var(--ink-3)' }}>
                      {job?.institutions?.institution_name ?? ''}
                      {job?.city ? ` · ${job.city}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon}{app.status}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                      {fmt(app.applied_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
