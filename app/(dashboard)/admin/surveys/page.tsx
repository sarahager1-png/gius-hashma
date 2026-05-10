import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Clock } from 'lucide-react'

export default async function AdminSurveysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const service = createServiceClient()

  const { data: surveys } = await service
    .from('placement_surveys')
    .select(`
      id, survey_type, submitted_at, overall_rating, q2_rating, q3_rating, recommend, notes, created_at,
      applications(
        jobs(title, institutions(institution_name)),
        candidates(profiles(full_name))
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = surveys ?? []
  const submitted = rows.filter(r => r.submitted_at)
  const responseRate = rows.length ? Math.round((submitted.length / rows.length) * 100) : 0
  const avgOverall = submitted.length
    ? (submitted.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / submitted.length).toFixed(1)
    : '—'

  const candSurveys = submitted.filter(r => r.survey_type === 'candidate_about_institution')
  const instSurveys = submitted.filter(r => r.survey_type === 'institution_about_candidate')

  function avgRating(arr: typeof submitted) {
    if (!arr.length) return '—'
    return (arr.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / arr.length).toFixed(1)
  }

  function Stars({ value }: { value: number | null }) {
    if (!value) return <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>—</span>
    return (
      <span className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={12} fill={i <= value ? '#F59E0B' : 'none'} style={{ color: '#F59E0B' }} />
        ))}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] mb-1.5" style={{ color: 'var(--teal-600)' }}>
          ניתוח משוב
        </p>
        <h1 className="text-[28px] font-black" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
          סקרי שביעות רצון
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סקרים נשלחו', value: rows.length, icon: <MessageSquare size={18} />, color: 'var(--purple)' },
          { label: 'הושלמו', value: `${submitted.length} (${responseRate}%)`, icon: <ThumbsUp size={18} />, color: '#1A7A4A' },
          { label: 'ממוצע כללי', value: `${avgOverall} ★`, icon: <Star size={18} />, color: '#F59E0B' },
          { label: 'ממתינים', value: rows.length - submitted.length, icon: <Clock size={18} />, color: '#B45309' },
        ].map(k => (
          <div key={k.label} className="rounded-[16px] border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: k.color }}>
              {k.icon}
              <span className="text-[11px] font-bold uppercase tracking-wide">{k.label}</span>
            </div>
            <p className="text-[24px] font-black" style={{ color: 'var(--ink)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Split averages */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-[16px] border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--ink)' }}>מועמדות על מוסד</p>
          <p className="text-[11px] mb-2" style={{ color: 'var(--ink-4)' }}>{candSurveys.length} תגובות</p>
          <p className="text-[22px] font-black" style={{ color: '#F59E0B' }}>{avgRating(candSurveys)} ★</p>
        </div>
        <div className="rounded-[16px] border p-4" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--ink)' }}>מוסד על מועמדת</p>
          <p className="text-[11px] mb-2" style={{ color: 'var(--ink-4)' }}>{instSurveys.length} תגובות</p>
          <p className="text-[22px] font-black" style={{ color: '#F59E0B' }}>{avgRating(instSurveys)} ★</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[18px] border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--line)' }}>
        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
              {['סוג', 'מועמדת', 'מוסד', 'משרה', 'ממוצע', 'ק2', 'ק3', 'ממליץ', 'הערות', 'נשלח'].map(h => (
                <th key={h} className="text-start px-3 py-2.5 text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const app = r.applications as unknown as {
                jobs: { title: string; institutions: { institution_name: string } | null } | null
                candidates: { profiles: { full_name: string | null } | null } | null
              } | null
              const isCandidate = r.survey_type === 'candidate_about_institution'
              const pending = !r.submitted_at

              return (
                <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none', opacity: pending ? 0.6 : 1 }}>
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: isCandidate ? '#EDE9FE' : '#E0F2FE', color: isCandidate ? '#5B3E9E' : '#0369A1' }}>
                      {isCandidate ? 'מועמדת' : 'מוסד'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--ink)' }}>
                    {app?.candidates?.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--ink-2)' }}>
                    {app?.jobs?.institutions?.institution_name ?? '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--ink-2)' }}>
                    {app?.jobs?.title ?? '—'}
                  </td>
                  <td className="px-3 py-2.5"><Stars value={r.overall_rating} /></td>
                  <td className="px-3 py-2.5"><Stars value={r.q2_rating} /></td>
                  <td className="px-3 py-2.5"><Stars value={r.q3_rating} /></td>
                  <td className="px-3 py-2.5">
                    {r.recommend === true ? <ThumbsUp size={14} style={{ color: '#1A7A4A' }} /> :
                     r.recommend === false ? <ThumbsDown size={14} style={{ color: '#DC2626' }} /> :
                     <span style={{ color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px]">
                    {r.notes ? (
                      <span className="text-[12px] truncate block" style={{ color: 'var(--ink-2)' }} title={r.notes}>
                        {r.notes.slice(0, 40)}{r.notes.length > 40 ? '…' : ''}
                      </span>
                    ) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[11px]" style={{ color: 'var(--ink-4)' }}>
                    {pending ? 'ממתין' : new Date(r.submitted_at!).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-12 text-center" style={{ color: 'var(--ink-3)' }}>
            <Star size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">אין סקרים עדיין</p>
            <p className="text-[12px] mt-1">סקרים נשלחים אוטומטית 30 יום לאחר שיבוץ</p>
          </div>
        )}
      </div>
    </div>
  )
}
