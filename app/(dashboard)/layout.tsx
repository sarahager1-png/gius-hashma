import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppHeader from '@/components/layout/app-header'
import AppSidebar from '@/components/layout/app-sidebar'
import WaFloatButton from '@/components/layout/wa-float-button'
import type { UserRole } from '@/lib/types'

function roleHome(role: string): string {
  if (role === 'מועמדת') return '/jobs'
  if (role === 'מוסד')   return '/institution/jobs'
  return '/dashboard'
}

function canAccess(role: string, pathname: string): boolean {
  // admins can access everything
  if (['מנהלת מערכת', 'אדמין מערכת'].includes(role)) return true

  // candidate: own pages — NOT /dashboard
  if (role === 'מועמדת') {
    const allowed = ['/jobs', '/my-applications', '/my-invitations', '/book-interview', '/inbox', '/notifications', '/history', '/profile', '/help', '/institutions']
    return allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
  }

  // institution: only recruitment core + account
  if (role === 'מוסד') {
    const allowed = [
      '/institution/jobs',
      '/institution/candidates',
      '/institution/matches',
      '/institution/profile',
      '/settings',
      '/help',
    ]
    return allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
  }

  return false
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // role-based route guard
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? ''
  if (pathname && !canAccess(profile.role, pathname)) {
    redirect(roleHome(profile.role))
  }

  const { data: waRow } = await service
    .from('system_settings')
    .select('value')
    .eq('key', 'support_wa_number')
    .single()
  const waPhone = waRow?.value || process.env.NEXT_PUBLIC_WA_SUPPORT_NUMBER || ''

  let pendingInstitutions   = 0
  let pendingApplications   = 0
  let pendingInquiries      = 0
  let pendingCandidateReqs  = 0

  if (['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    const [instRes, reqRes] = await Promise.all([
      service.from('institutions').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      Promise.resolve(
        service.from('candidate_requests').select('*', { count: 'exact', head: true }).eq('status', 'ממתינה')
      ).catch(() => ({ count: 0 as number | null })),
    ])
    pendingInstitutions  = instRes.count  ?? 0
    pendingCandidateReqs = reqRes.count   ?? 0
  }

  if (profile.role === 'מוסד') {
    const { data: inst } = await service
      .from('institutions')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (inst) {
      const { data: jobRows } = await service
        .from('jobs')
        .select('id')
        .eq('institution_id', inst.id)

      const jobIds = (jobRows ?? []).map((j: { id: string }) => j.id)

      const [appsCountRes, inquiriesCountRes] = await Promise.all([
        jobIds.length > 0
          ? service.from('applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'ממתינה')
          : Promise.resolve({ count: 0 }),
        service.from('candidate_inquiries').select('*', { count: 'exact', head: true }).eq('institution_id', inst.id).eq('status', 'ממתינה'),
      ])

      pendingApplications = appsCountRes.count ?? 0
      pendingInquiries    = inquiriesCountRes.count ?? 0
    }
  }

  return (
    <>
    <style>{`html, body { overflow: hidden; height: 100%; }`}</style>
    <div className="dashboard-grid" style={{ background: 'var(--bg-2)' }}>
      <AppHeader fullName={profile.full_name} role={profile.role} />
      <AppSidebar
        role={profile.role as UserRole}
        fullName={profile.full_name}
        pendingInstitutions={pendingInstitutions}
        pendingApplications={pendingApplications}
        pendingInquiries={pendingInquiries}
        pendingCandidateReqs={pendingCandidateReqs}
      />
      <main style={{ minWidth: 0, minHeight: 0, overflowX: 'hidden', overflowY: 'auto' }}>{children}</main>
      {waPhone && <WaFloatButton phone={waPhone} />}
    </div>
    </>
  )
}
