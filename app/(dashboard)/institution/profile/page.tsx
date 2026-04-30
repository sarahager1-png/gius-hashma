import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InstitutionProfileFormClient from './profile-form-client'

export default async function InstitutionProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, city, district, address, phone, institution_type, is_approved, profiles(full_name, phone)')
    .eq('profile_id', user.id)
    .single()

  if (!institution) redirect('/dashboard')
  if (!institution.is_approved) redirect('/dashboard')

  const prof = institution.profiles as unknown as { full_name: string | null; phone: string | null } | null

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
          פרופיל המוסד
        </h1>
        <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
          {institution.institution_name}
        </p>
      </div>
      <InstitutionProfileFormClient
        institution={institution}
        profile={{ full_name: prof?.full_name ?? null, phone: prof?.phone ?? null }}
      />
    </div>
  )
}
