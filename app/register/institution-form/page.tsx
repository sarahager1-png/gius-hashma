import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import InstitutionFormClient from './form-client'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'הצטרפות למערכת השביל',
  description: 'פלטפורמה חכמה לגיוס והשמת סגל הוראה ברשת חינוך חב"ד — מלאי את פרטי המוסד וקבלי גישה מלאה',
  openGraph: {
    title: 'מערכת השביל — הצטרפות מוסד',
    description: 'פלטפורמה חכמה לגיוס והשמת סגל הוראה ברשת חינוך חב"ד',
    locale: 'he_IL',
    type: 'website',
    images: [{ url: 'https://giuus.vercel.app/og-image.png', width: 1200, height: 630, alt: 'מערכת השביל' }],
  },
}

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
          <div className="flex justify-center mb-5">
            <div className="rounded-2xl bg-white p-3 shadow-sm border border-purple-100">
              <Image src="/logo-chabad.png" alt="לוגו הרשת" width={140} height={44} className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-[26px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            הַשְּׁבִיל — מערכת גיוס והשמה
          </h1>
          <p className="text-[14px] mt-2 font-medium" style={{ color: '#7C3AED' }}>
            {lead
              ? `ברוכה הבאה! נשלים את הרשמת ${lead.institution_name}`
              : 'מחברים בין מוסדות חינוך למועמדות המצוינות ביותר'}
          </p>
          {!lead && (
            <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: '#9CA3AF' }}>
              הרשמה פשוטה וקצרה — ותוכלי להתחיל לפרסם משרות ולמצוא את האנשים הנכונים לצוות שלך
            </p>
          )}
        </div>
        <InstitutionFormClient lead={lead} />
      </div>
    </div>
  )
}
