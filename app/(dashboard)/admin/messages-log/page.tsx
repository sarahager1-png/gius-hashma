import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  new_application:       'הגשה חדשה',
  application_viewed:    'הגשה נצפתה',
  application_accepted:  'התקבלה',
  application_rejected:  'נדחתה',
  interview_scheduled:   'ראיון נקבע',
  interview_reminder:    'תזכורת ראיון',
  invitation_sent:       'הזמנה נשלחה',
  invitation_reminder:   'תזכורת הזמנה',
  institution_approved:  'מוסד אושר',
  institution_rejected:  'מוסד נדחה',
  match_suggestion:      'הצעת משרה',
  job_expiry_warning:    'אזהרת תפוגה',
  pending_apps_reminder: 'תזכורת הגשות',
  stale_application:     'הגשה תקועה',
  weekly_summary:        'סיכום שבועי',
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  new_application:      { bg: '#EFF6FF', color: '#1D4ED8' },
  application_accepted: { bg: '#F0FDF4', color: '#15803D' },
  application_rejected: { bg: '#FEF2F2', color: '#DC2626' },
  institution_approved: { bg: '#F0FDF4', color: '#15803D' },
  institution_rejected: { bg: '#FEF2F2', color: '#DC2626' },
  match_suggestion:     { bg: '#FAF5FF', color: '#7C3AED' },
  job_expiry_warning:   { bg: '#FFF7ED', color: '#C2410C' },
  pending_apps_reminder:{ bg: '#FFFBEB', color: '#92400E' },
}

export default async function MessagesLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: notifications } = await service
    .from('notifications')
    .select('id, profile_id, type, title, body, read, created_at, profiles(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: waLogs } = await service
    .from('wa_log')
    .select('id, direction, phone, message, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">יומן הודעות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">{notifications?.length ?? 0} התראות · {waLogs?.length ?? 0} הודעות וואצאפ</p>
        </div>
      </div>

      {/* Notifications table */}
      <section className="mb-10">
        <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--ink-2)' }}>התראות מערכת</h2>

        {/* desktop table */}
        <div className="hidden md:block rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
                {['נמען', 'תפקיד', 'סוג', 'כותרת', 'תוכן', 'תאריך', 'נקרא'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--ink-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(notifications ?? []).map((n, i) => {
                const profile = n.profiles as unknown as { full_name: string | null; role: string | null } | null
                const typeCfg = TYPE_COLORS[n.type] ?? { bg: '#F3F4F6', color: '#6B7280' }
                return (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? '#fff' : 'var(--bg-2)' }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--ink)' }}>{profile?.full_name ?? '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>{profile?.role ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: typeCfg.bg, color: typeCfg.color }}>
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium max-w-[160px] truncate" style={{ color: 'var(--ink)' }}>{n.title}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate" style={{ color: 'var(--ink-3)' }}>{n.body}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--ink-4)' }}>{formatDate(n.created_at)}</td>
                    <td className="px-3 py-2.5 text-center">{n.read ? '✓' : <span style={{ color: 'var(--amber)' }}>●</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!notifications?.length && (
            <div className="p-8 text-center text-[14px]" style={{ color: 'var(--ink-4)' }}>אין התראות עדיין</div>
          )}
        </div>

        {/* mobile cards */}
        <div className="md:hidden space-y-2">
          {(notifications ?? []).map(n => {
            const profile = n.profiles as unknown as { full_name: string | null; role: string | null } | null
            const typeCfg = TYPE_COLORS[n.type] ?? { bg: '#F3F4F6', color: '#6B7280' }
            return (
              <div key={n.id} className="rounded-[14px] p-4" style={{ background: '#fff', border: '1px solid var(--line)' }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-[13px]" style={{ color: 'var(--ink)' }}>{profile?.full_name ?? '—'}</span>
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: typeCfg.bg, color: typeCfg.color }}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                </div>
                <p className="text-[12.5px] font-medium mb-0.5" style={{ color: 'var(--ink)' }}>{n.title}</p>
                <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>{n.body}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--ink-4)' }}>{formatDate(n.created_at)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* WhatsApp log */}
      <section>
        <h2 className="text-[15px] font-bold mb-4" style={{ color: 'var(--ink-2)' }}>יומן וואצאפ</h2>
        <div className="space-y-2">
          {(waLogs ?? []).map(log => (
            <div key={log.id} className="rounded-[14px] p-4 flex items-start gap-3"
              style={{ background: '#fff', border: '1px solid var(--line)' }}>
              <span className="text-[18px] shrink-0">{log.direction === 'inbound' ? '📩' : '📤'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{log.phone}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: log.direction === 'inbound' ? '#EFF6FF' : '#F0FDF4', color: log.direction === 'inbound' ? '#1D4ED8' : '#15803D' }}>
                    {log.direction === 'inbound' ? 'נכנסת' : 'יוצאת'}
                  </span>
                </div>
                <p className="text-[12.5px] break-words" style={{ color: 'var(--ink-2)' }}>{log.message}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{formatDate(log.created_at)}</p>
              </div>
            </div>
          ))}
          {!waLogs?.length && (
            <div className="rounded-[14px] p-8 text-center text-[14px]" style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-4)' }}>
              אין הודעות וואצאפ עדיין
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
