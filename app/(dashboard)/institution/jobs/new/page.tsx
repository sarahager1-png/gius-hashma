import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JobFormClient from '@/components/institution/job-form'

export default async function NewJobPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/dashboard')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <a href="/institution/jobs" className="text-sm text-gray-400 hover:text-gray-600">← חזרה</a>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#5B3AAB' }}>פרסום משרה חדשה</h1>
      </div>
      <JobFormClient institutionId={institution.id} />
    </div>
  )
}
