import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import ApproveButton from './approve-button'

export default async function AdminInstitutionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: institutions } = await supabase
    .from('institutions')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false })

  const pending = institutions?.filter(i => !i.is_approved) ?? []
  const approved = institutions?.filter(i => i.is_approved) ?? []

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#5B3AAB' }}>ניהול מוסדות</h1>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            ממתינים לאישור ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(inst => (
              <div key={inst.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-800">{inst.institution_name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {inst.institution_type && <span>{inst.institution_type} · </span>}
                    {inst.city}
                  </div>
                  <div className="text-sm text-gray-500">{inst.profiles?.full_name} · {inst.profiles?.phone}</div>
                  <div className="text-xs text-gray-400 mt-1">{formatDate(inst.created_at)}</div>
                </div>
                <ApproveButton institutionId={inst.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold text-gray-600 mb-3">מוסדות מאושרים ({approved.length})</h2>
        <div className="space-y-2">
          {approved.map(inst => (
            <div key={inst.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">{inst.institution_name}</div>
                <div className="text-sm text-gray-500">{inst.institution_type} · {inst.city}</div>
              </div>
              <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full">מאושר</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
