import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminJobFormClient from './admin-job-form-client'

export default async function AdminNewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: institutions } = await service
    .from('institutions')
    .select('id, institution_name, city')
    .eq('is_approved', true)
    .order('institution_name')

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <a href="/jobs" className="text-[13px] font-semibold" style={{ color: 'var(--purple)' }}>
          ← חזרה למשרות
        </a>
        <h1 className="text-[26px] font-extrabold mt-2" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
          פרסום משרה חדשה
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>בחרי מוסד ומלאי את פרטי המשרה</p>
      </div>
      <AdminJobFormClient institutions={institutions ?? []} />
    </div>
  )
}
