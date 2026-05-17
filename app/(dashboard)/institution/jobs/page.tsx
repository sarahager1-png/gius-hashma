import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Job } from '@/lib/types'
import Link from 'next/link'
import JobsListClient from './jobs-list-client'

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']

export default async function InstitutionJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: viewerProfile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = viewerProfile && ADMIN_ROLES.includes(viewerProfile.role)

  if (isAdmin) redirect('/admin/institutions')

  const { data: institution } = await service.from('institutions').select('id, institution_name, is_approved').eq('profile_id', user.id).single()

  if (!institution) redirect('/institution/profile')
  if (!institution.is_approved) redirect('/institution/profile')

  type JobWithApps = Job & { applications?: { count: number }[] }

  const { data } = await service
    .from('jobs')
    .select('*, applications(count)')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })
  const jobs = (data ?? []) as JobWithApps[]

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
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white no-underline"
          style={{ background: 'var(--purple)' }}>
          + משרה חדשה
        </Link>
      </div>
      <JobsListClient jobs={jobs} />
    </div>
  )
}
