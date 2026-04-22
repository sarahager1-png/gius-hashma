import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/layout/app-sidebar'
import type { UserRole } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen" dir="rtl">
      <AppSidebar role={profile.role as UserRole} fullName={profile.full_name} />
      <main className="flex-1 overflow-auto" style={{ background: '#F2F0F8' }}>
        {children}
      </main>
    </div>
  )
}
