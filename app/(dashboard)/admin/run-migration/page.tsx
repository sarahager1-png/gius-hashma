import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MigrationRunner from './migration-runner'

export default async function MigrationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  // Check current DB state
  const checks = await Promise.all([
    service.from('jobs').select('district').limit(1).then(r => ({ col: 'jobs.district', ok: !r.error })),
    service.from('jobs').select('placement_type').limit(1).then(r => ({ col: 'jobs.placement_type', ok: !r.error })),
    service.from('jobs').select('start_date').limit(1).then(r => ({ col: 'jobs.start_date', ok: !r.error })),
    service.from('institutions').select('district').limit(1).then(r => ({ col: 'institutions.district', ok: !r.error })),
    service.from('candidates').select('district').limit(1).then(r => ({ col: 'candidates.district', ok: !r.error })),
    service.from('candidates').select('technical_skills').limit(1).then(r => ({ col: 'candidates.technical_skills', ok: !r.error })),
    service.from('candidates').select('availability_from').limit(1).then(r => ({ col: 'candidates.availability_from', ok: !r.error })),
    service.from('interviews').select('id').limit(1).then(r => ({ col: 'interviews (table)', ok: !r.error })),
    service.from('notifications').select('id').limit(1).then(r => ({ col: 'notifications (table)', ok: !r.error })),
    service.from('invitations').select('id').limit(1).then(r => ({ col: 'invitations (table)', ok: !r.error })),
    service.from('candidate_requests').select('id').limit(1).then(r => ({ col: 'candidate_requests (table)', ok: !r.error })),
    service.from('access_codes').select('id').limit(1).then(r => ({ col: 'access_codes (table)', ok: !r.error })),
  ])

  return <MigrationRunner checks={checks} />
}
