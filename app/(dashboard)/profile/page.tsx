import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileFormClient from './profile-form-client'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'מועמדת') redirect('/dashboard')

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>הפרופיל שלי</h1>
      <ProfileFormClient profile={profile} candidate={candidate} />
    </div>
  )
}
