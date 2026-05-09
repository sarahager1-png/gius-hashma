import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function fmtDate(d: string) {
  return new Date(d).toLocaleString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_LABEL: Record<string, string> = {
  approve_institution:       'אישור מוסד',
  reject_institution:        'דחיית מוסד',
  approve_candidate_request: 'אישור מועמדת',
  reject_candidate_request:  'דחיית מועמדת',
}

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: logs } = await service
    .from('audit_log')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  type AuditRow = {
    id: string
    created_at: string
    actor_id: string | null
    action: string
    target_type: string | null
    target_id: string | null
    details: Record<string, unknown> | null
    profiles?: { full_name: string | null } | null
  }

  const rows = (logs ?? []) as AuditRow[]

  return (
    <div className="p-4 md:p-8 max-w-5xl" dir="rtl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] mb-1.5" style={{ color: 'var(--teal-600)' }}>
          ניהול
        </p>
        <h1 className="text-[30px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
          יומן פעולות
        </h1>
        <p className="text-[14px] font-medium mt-1.5" style={{ color: 'var(--ink-3)' }}>
          100 הפעולות האחרונות במערכת
        </p>
      </div>

      <div className="rounded-[16px] border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        {rows.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[14px]" style={{ color: 'var(--ink-3)' }}>אין פעולות ביומן עדיין</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
                  <th className="px-5 py-3.5 text-right font-bold" style={{ color: 'var(--ink-3)' }}>תאריך</th>
                  <th className="px-5 py-3.5 text-right font-bold" style={{ color: 'var(--ink-3)' }}>מבצע</th>
                  <th className="px-5 py-3.5 text-right font-bold" style={{ color: 'var(--ink-3)' }}>פעולה</th>
                  <th className="px-5 py-3.5 text-right font-bold" style={{ color: 'var(--ink-3)' }}>יעד</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none',
                      background: i % 2 === 0 ? '#fff' : 'var(--bg)',
                    }}
                  >
                    <td className="px-5 py-3.5" style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                      {fmtDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--ink)' }}>
                      {(log.profiles as unknown as { full_name: string | null } | null)?.full_name ?? log.actor_id?.substring(0, 8) ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold"
                        style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}
                      >
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px]" style={{ color: 'var(--ink-4)' }}>
                      {log.target_type ? `${log.target_type}` : '—'}
                      {log.target_id ? ` · ${log.target_id.substring(0, 8)}…` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
