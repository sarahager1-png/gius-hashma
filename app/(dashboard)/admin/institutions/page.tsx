import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InstitutionsManagerClient from './institutions-manager-client'
import GardenCoordinatorProfileCard from '@/components/institution/garden-coordinator-profile-card'

export default async function AdminInstitutionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת', 'מנהל רשת'].includes(profile.role)) redirect('/dashboard')

  const { data: institutions } = await service
    .from('institutions')
    .select('id, profile_id, institution_name, city, district, school_type, institution_type, is_approved, approved_by, created_at, owner:profiles!profile_id(full_name, phone)')
    .order('created_at', { ascending: false })

  const { data: leads } = await service
    .from('institution_leads')
    .select('id, institution_name, city, phone, institution_type')
    .is('registered_profile_id', null)
    .order('institution_name')

  // exclude leads whose name matches an already-registered institution
  const registeredNames = new Set(
    (institutions ?? []).map(i => i.institution_name.trim().toLowerCase())
  )
  const unregisteredLeads = (leads ?? []).filter(
    l => !registeredNames.has(l.institution_name.trim().toLowerCase())
  )

  // separate garden coordinators from regular institutions
  type InstRow = { id: string; profile_id: string; institution_name: string; city: string | null; district: string | null; institution_type: string | null; owner: { full_name: string | null; phone: string | null } | null }
  const allInstitutions = (institutions ?? []) as unknown as InstRow[]
  const coordinators = allInstitutions.filter(i => i.institution_type === 'מדריכה אזורית')
  const regularInstitutions = allInstitutions.filter(i => i.institution_type !== 'מדריכה אזורית')

  return (
    <>
      {/* Garden coordinators section */}
      {coordinators.length > 0 && (
        <div className="p-4 md:p-8 max-w-4xl">
          <div className="mb-4">
            <h2 className="text-[16px] font-extrabold" style={{ color: 'var(--ink)' }}>מדריכות אזוריות — גנים</h2>
            <p className="text-[13px]" style={{ color: 'var(--ink-4)' }}>{coordinators.length} מדריכות</p>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {coordinators.map(c => (
              <GardenCoordinatorProfileCard
                key={c.id}
                name={c.owner?.full_name ?? c.institution_name}
                district={c.district}
                phone={c.owner?.phone ?? null}
                email={null}
              />
            ))}
          </div>
          <div className="my-6" style={{ height: 1, background: 'var(--line)' }} />
        </div>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <InstitutionsManagerClient institutions={regularInstitutions as any} leads={unregisteredLeads} />
    </>
  )
}
