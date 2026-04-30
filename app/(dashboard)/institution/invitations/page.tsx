import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle, XCircle, Send } from 'lucide-react'

const STATUS_CFG: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  'ממתינה': { bg: '#EDE9FE', color: '#5B3E9E', label: 'ממתינה לתגובה', icon: <Clock size={12} /> },
  'התקבלה': { bg: '#E4F6ED', color: '#1A7A4A', label: 'התקבלה',        icon: <CheckCircle size={12} /> },
  'נדחתה':  { bg: '#F4F4F5', color: '#71717A', label: 'נדחתה',         icon: <XCircle size={12} /> },
}

function fmtDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  if (days < 7) return `לפני ${days} ימים`
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

export default async function InstitutionInvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: institution } = await service
    .from('institutions')
    .select('id, institution_name, is_approved')
    .eq('profile_id', user.id)
    .single()

  if (!institution?.is_approved) redirect('/dashboard')

  const { data } = await service
    .from('invitations')
    .select('id, status, scheduled_at, created_at, job_id, jobs(id, title, city), candidates(id, profiles(full_name, phone))')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  const invitations = data ?? []
  const pending  = invitations.filter(i => i.status === 'ממתינה').length
  const accepted = invitations.filter(i => i.status === 'התקבלה').length

  type InvRow = typeof invitations[number]

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            הזמנות שנשלחו
          </h1>
          <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
            {invitations.length} הזמנות · {pending} ממתינות · {accepted} התקבלו
          </p>
        </div>
        <Link href="/institution/candidates"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white no-underline"
          style={{ background: 'var(--purple)' }}>
          <Send size={14} />הזמיני מועמדת
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Send size={36} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--ink-3)' }}>לא נשלחו הזמנות עדיין</p>
          <Link href="/institution/candidates" className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>
            חפשי מועמדות →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(invitations as InvRow[]).map(inv => {
            const cand = inv.candidates as unknown as { id: string; profiles: { full_name: string | null; phone: string | null } | null } | null
            const job  = inv.jobs as unknown as { id: string; title: string; city: string | null } | null
            const sc   = STATUS_CFG[inv.status] ?? STATUS_CFG['נדחתה']
            return (
              <div key={inv.id}
                className="rounded-[16px] border p-5"
                style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>
                      {cand?.profiles?.full_name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                      {job?.title && (
                        <Link href={`/institution/jobs/${job.id}`}
                          className="font-semibold no-underline" style={{ color: 'var(--purple)' }}>
                          {job.title}
                        </Link>
                      )}
                      {job?.city && <span>· {job.city}</span>}
                      {cand?.profiles?.phone && (
                        <a href={`tel:${cand.profiles.phone}`} className="no-underline" style={{ color: 'var(--teal)' }}>
                          {cand.profiles.phone}
                        </a>
                      )}
                    </div>
                    {inv.scheduled_at && (
                      <p className="flex items-center gap-1 mt-1.5 text-[12px] font-semibold" style={{ color: 'var(--purple)' }}>
                        <Calendar size={11} />ראיון מוצע: {fmtDt(inv.scheduled_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.icon}{sc.label}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                      {fmtDate(inv.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
