import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CandidateCard from '@/components/candidates/candidate-card'

export default async function SearchCandidatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/dashboard')

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, profiles(full_name, phone)')
    .neq('availability_status', 'לא פעילה')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>מאגר מועמדות</h1>
      {!candidates?.length ? (
        <p className="text-center text-gray-400 py-16">אין מועמדות במאגר</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {candidates.map(c => <CandidateCard key={c.id} candidate={c} />)}
        </div>
      )}
    </div>
  )
}
