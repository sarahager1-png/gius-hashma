import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AppHeader from '@/components/layout/app-header'
import AppSidebar from '@/components/layout/app-sidebar'
import WaFloatButton from '@/components/layout/wa-float-button'
import type { UserRole } from '@/lib/types'

function canAccess(role: string, pathname: string): boolean {
  // admins can access everything
  if (['מנהל רשת', 'אדמין מערכת'].includes(role)) return true

  // candidate: only her own pages
  if (role === 'מועמדת') {
    const allowed = ['/dashboard', '/jobs', '/my-applications', '/my-invitations', '/history', '/profile', '/help']
    return allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
  }

  // institution: only institution sub-pages + individual candidate profiles
  if (role === 'מוסד') {
    const allowed = ['/dashboard', '/institution', '/history', '/help']
    // allow /candidates/[id] (single profile) but not /candidates (admin list)
    if (/^\/candidates\/[^/]+$/.test(pathname)) return true
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
    redirect('/dashboard')
  }

  const waPhone = process.env.NEXT_PUBLIC_WA_SUPPORT_NUMBER ?? ''

  let pendingInstitutions = 0
  if (['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) {
    const { count } = await service
      .from('institutions')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)
    pendingInstitutions = count ?? 0
  }

  return (
    <div className="dashboard-grid" style={{ background: 'var(--bg-2)' }}>
      <AppHeader fullName={profile.full_name} role={profile.role} />
      <AppSidebar role={profile.role as UserRole} fullName={profile.full_name} pendingInstitutions={pendingInstitutions} />
      <main style={{ minWidth: 0, overflowX: 'hidden' }}>{children}</main>
      {waPhone && <WaFloatButton phone={waPhone} />}
    </div>
  )
}
