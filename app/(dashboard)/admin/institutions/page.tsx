import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import ApproveButton from './approve-button'
import AddInstitutionModal from './add-institution-modal'


export default async function AdminInstitutionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { data: institutions } = await service
    .from('institutions')
    .select('*, owner:profiles!profile_id(full_name, phone)')
    .order('created_at', { ascending: false })

  const pending  = institutions?.filter(i => !i.is_approved) ?? []
  // admin-invited: approved but no approver (created directly by admin)
  const invited  = institutions?.filter(i => i.is_approved && !i.approved_by) ?? []
  // self-registered and formally approved
  const approved = institutions?.filter(i => i.is_approved && i.approved_by) ?? []

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מוסדות</h1>
          <span className="brand-line" />
          <p className="page-subtitle">
            {approved.length + invited.length} מאושרים
            {invited.length > 0 ? ` · ${invited.length} ממתינים להשלמת פרטים` : ''}
            {pending.length > 0 ? ` · ${pending.length} ממתינים לאישור` : ''}
          </p>
        </div>
        <AddInstitutionModal />
      </div>

      {/* Pending self-registrations — need admin approval */}
      {pending.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--amber)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--amber)' }}>ממתינים לאישור ({pending.length})</h2>
          </div>
          <div className="space-y-3">
            {pending.map(inst => (
              <div key={inst.id} className="rounded-[16px] overflow-hidden"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)', borderInlineStart: '4px solid var(--amber)' }}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>{inst.institution_name}</span>
                      </div>
                    <div className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{inst.city}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                      {(inst.owner as { full_name: string | null; phone: string | null } | null)?.full_name} · {(inst.owner as { full_name: string | null; phone: string | null } | null)?.phone}
                    </div>
                    <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-4)' }}>{formatDate(inst.created_at)}</div>
                  </div>
                  <ApproveButton institutionId={inst.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invited by admin — awaiting profile completion */}
      {invited.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--purple)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--purple)' }}>הוזמנו — ממתינים להשלמת פרטים ({invited.length})</h2>
          </div>
          <div className="space-y-2">
            {invited.map(inst => (
              <div key={inst.id} className="rounded-[14px] p-4 flex items-center justify-between"
                style={{ background: '#fff', border: '1px solid var(--line)', borderInlineStart: '3px solid var(--purple)', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{inst.institution_name}</span>
                  </div>
                  <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                    {inst.city}
                    {(inst.owner as { phone: string | null } | null)?.phone ? ` · ${(inst.owner as { phone: string | null }).phone}` : ''}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{formatDate(inst.created_at)}</div>
                </div>
                <span className="status-badge" style={{ background: '#EDE9FE', color: 'var(--purple)' }}>הוזמן</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Self-registered and formally approved */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>מוסדות מאושרים ({approved.length})</h2>
        </div>
        {approved.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p className="empty-state__title">אין מוסדות מאושרים עדיין</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {approved.map(inst => (
              <div key={inst.id} className="rounded-[14px] p-4 flex items-center justify-between"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{inst.institution_name}</span>
                  </div>
                  <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{inst.city}</div>
                </div>
                <span className="status-badge" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>מאושר</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
