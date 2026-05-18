import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import InstitutionProfileFormClient from './profile-form-client'

export default async function InstitutionProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, city, district, address, phone, institution_type, school_type, principal_name, whatsapp_preference, is_approved, profiles(full_name, phone)')
    .eq('profile_id', user.id)
    .single()

  if (!institution) redirect('/register/institution')

  const prof = institution.profiles as unknown as { full_name: string | null; phone: string | null } | null
  const sp = await searchParams
  const isSetup = sp.setup === '1' || !institution.district || !institution.school_type

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {isSetup && (
        <div className="rounded-[16px] p-5 mb-6 flex gap-4" style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #FAF5FF 100%)', border: '1.5px solid #C4B5FD' }}>
          <div className="text-2xl shrink-0">🏫</div>
          <div>
            <p className="text-[16px] font-extrabold mb-1" style={{ color: 'var(--purple)' }}>ברוכות הבאות! נשלים את פרטי המוסד</p>
            <p className="text-[13px]" style={{ color: '#6D28D9' }}>
              לפני פרסום משרות יש למלא מחוז וסוג המוסד. זה לוקח פחות מדקה.
            </p>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
          פרופיל המוסד
        </h1>
        <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
          {institution.institution_name}
        </p>
      </div>
      <InstitutionProfileFormClient
        institution={{ ...institution, whatsapp_preference: (institution.whatsapp_preference as boolean | null) ?? true }}
        profile={{ full_name: prof?.full_name ?? null, phone: prof?.phone ?? null }}
      />
    </div>
  )
}
