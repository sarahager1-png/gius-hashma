import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CandidateCard from '@/components/candidates/candidate-card'

export default async function AdminCandidatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#5B3AAB' }}>
          כל המועמדות
          <span className="text-base font-normal text-gray-400 mr-2">({candidates?.length ?? 0})</span>
        </h1>
      </div>

      {!candidates?.length ? (
        <p className="text-center text-gray-400 py-16">אין מועמדות במערכת</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {candidates.map(c => <CandidateCard key={c.id} candidate={c} />)}
        </div>
      )}
    </div>
  )
}
