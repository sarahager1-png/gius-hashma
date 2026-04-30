import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminsClient from './admins-client'

export default async function AdminsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const [profilesRes, usersRes] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, role, created_at')
      .in('role', ['מנהל רשת', 'אדמין מערכת'])
      .order('created_at', { ascending: true }),
    service.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const profiles = profilesRes.data ?? []
  const emailMap: Record<string, string> = {}
  for (const u of usersRes.data?.users ?? []) {
    emailMap[u.id] = u.email ?? ''
  }

  const admins = profiles.map(p => ({
    id: p.id,
    full_name: p.full_name ?? '',
    role: p.role,
    email: emailMap[p.id] ?? '',
    created_at: p.created_at,
  }))

  return <AdminsClient initialAdmins={admins} currentUserId={user.id} />
}
