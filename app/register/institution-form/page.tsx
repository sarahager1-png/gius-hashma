import { createServiceClient } from '@/lib/supabase/server'
import InstitutionFormClient from './form-client'

export default async function InstitutionFormPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>
}) {
  const sp = await searchParams
  const leadId = sp.lead?.trim() || null

  let lead: {
    id: string
    institution_name: string
    city: string | null
    phone: string | null
    institution_type: string | null
  } | null = null

  if (leadId) {
    const service = createServiceClient()
    const { data } = await service
      .from('institution_leads')
      .select('id, institution_name, city, phone, institution_type')
      .eq('id', leadId)
      .is('registered_profile_id', null)
      .single()
    lead = data
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 60%, #FAF5FF 100%)' }}
      dir="rtl">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            הצטרפות למערכת השביל
          </h1>
          <p className="text-[14px] mt-2" style={{ color: '#6D28D9' }}>
            {lead ? `ברוכה הבאה! נשלים את הרשמת ${lead.institution_name}` : 'הכנסי את פרטי המוסד להרשמה'}
          </p>
        </div>
        <InstitutionFormClient lead={lead} />
      </div>
    </div>
  )
}
