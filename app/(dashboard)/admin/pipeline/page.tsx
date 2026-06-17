import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Route, Phone, Briefcase, Building2, Send, Eye, CalendarCheck, CheckCircle2, XCircle } from 'lucide-react'
import ApplicationTimeline from '@/components/application-timeline'

export const dynamic = 'force-dynamic'

type StageKey = 'ממתינה' | 'נצפתה' | 'ראיון' | 'התקבלה' | 'סגורה'

const STAGE_META: Record<StageKey, { label: string; color: string; bg: string; Icon: typeof Send }> = {
  'ממתינה':  { label: 'ממתינות לצפייה', color: '#5B3AAB', bg: '#F1ECFB', Icon: Send },
  'נצפתה':   { label: 'נצפו, לפני ראיון', color: '#0369A1', bg: '#E0F2FE', Icon: Eye },
  'ראיון':   { label: 'בשלב ראיון',      color: '#B45309', bg: '#FEF3C7', Icon: CalendarCheck },
  'התקבלה':  { label: 'התקבלו / שובצו',  color: '#15803D', bg: '#DCFCE7', Icon: CheckCircle2 },
  'סגורה':   { label: 'נסגרו (נדחו/בוטלו)', color: '#B91C1C', bg: '#FEE2E2', Icon: XCircle },
}

const STAGE_ORDER: StageKey[] = ['ממתינה', 'נצפתה', 'ראיון', 'התקבלה', 'סגורה']

function currentStage(status: string, hasInterview: boolean): StageKey {
  if (status === 'התקבלה') return 'התקבלה'
  if (status === 'נדחתה' || status === 'בוטלה') return 'סגורה'
  if (hasInterview) return 'ראיון'
  if (status === 'נצפתה') return 'נצפתה'
  return 'ממתינה'
}

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await createServiceClient().from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת'].includes(profile.role)) redirect('/dashboard')

  const { stage } = await searchParams
  const service = createServiceClient()

  const { data: apps } = await service
    .from('applications')
    .select('id, status, applied_at, updated_at, placement_date, candidate_id, candidates(profiles(full_name, phone)), jobs(title, institutions(institution_name))')
    .order('updated_at', { ascending: false })

  const rows = apps ?? []

  // attach latest interview per application
  const ivMap: Record<string, string> = {}
  if (rows.length) {
    const { data: ivs } = await service
      .from('interviews')
      .select('application_id, scheduled_at')
      .in('application_id', rows.map(r => r.id))
      .order('scheduled_at', { ascending: false })
    for (const iv of ivs ?? []) {
      if (!ivMap[iv.application_id]) ivMap[iv.application_id] = iv.scheduled_at
    }
  }

  type Row = {
    id: string
    status: string
    applied_at: string
    updated_at: string | null
    placement_date: string | null
    candidateName: string
    candidatePhone: string | null
    jobTitle: string
    institutionName: string
    interviewAt: string | null
    stage: StageKey
  }

  const enriched: Row[] = rows.map(r => {
    const prof = (r.candidates as unknown as { profiles: { full_name: string | null; phone: string | null } } | null)?.profiles
    const job = r.jobs as unknown as { title: string; institutions: { institution_name: string } | null } | null
    const interviewAt = ivMap[r.id] ?? null
    return {
      id: r.id,
      status: r.status,
      applied_at: r.applied_at,
      updated_at: r.updated_at,
      placement_date: r.placement_date,
      candidateName: prof?.full_name ?? 'מועמדת',
      candidatePhone: prof?.phone ?? null,
      jobTitle: job?.title ?? '—',
      institutionName: job?.institutions?.institution_name ?? '',
      interviewAt,
      stage: currentStage(r.status, !!interviewAt),
    }
  })

  const counts = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = enriched.filter(r => r.stage === s).length
    return acc
  }, {} as Record<StageKey, number>)

  const activeStage = STAGE_ORDER.includes(stage as StageKey) ? (stage as StageKey) : null
  const visible = activeStage ? enriched.filter(r => r.stage === activeStage) : enriched

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <Route size={22} style={{ color: 'var(--purple)' }} />מסלול מועמדות
        </h1>
        <span className="brand-line" />
        <p className="page-subtitle">{enriched.length} הגשות · איפה כל מועמדת עומדת — בלחיצה אחת</p>
      </div>

      {/* Stage summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-7">
        <Link
          href="/admin/pipeline"
          className="rounded-[14px] border p-3 text-center transition-all"
          style={{
            background: !activeStage ? 'var(--purple)' : '#fff',
            borderColor: !activeStage ? 'var(--purple)' : 'var(--line)',
            color: !activeStage ? '#fff' : 'var(--ink-2)',
          }}
        >
          <div className="text-[22px] font-extrabold leading-none">{enriched.length}</div>
          <div className="text-[11.5px] font-bold mt-1">הכול</div>
        </Link>
        {STAGE_ORDER.map(s => {
          const meta = STAGE_META[s]
          const on = activeStage === s
          return (
            <Link
              key={s}
              href={`/admin/pipeline?stage=${encodeURIComponent(s)}`}
              className="rounded-[14px] border p-3 text-center transition-all"
              style={{
                background: on ? meta.color : meta.bg,
                borderColor: on ? meta.color : 'transparent',
                color: on ? '#fff' : meta.color,
              }}
            >
              <div className="text-[22px] font-extrabold leading-none">{counts[s]}</div>
              <div className="text-[11px] font-bold mt-1 leading-tight">{meta.label}</div>
            </Link>
          )
        })}
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div className="rounded-[14px] border p-16 text-center" style={{ background: '#fff', borderColor: 'var(--line)' }}>
          <Route size={38} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--ink-3)' }}>אין הגשות בשלב זה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <div key={r.id}
              className="rounded-[16px] border flex flex-col gap-4 p-5"
              style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>{r.candidateName}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                    <span className="flex items-center gap-1"><Briefcase size={12} />{r.jobTitle}</span>
                    {r.institutionName && <span className="flex items-center gap-1"><Building2 size={12} />{r.institutionName}</span>}
                  </div>
                </div>
                {r.candidatePhone && (
                  <a href={`tel:${r.candidatePhone}`} dir="ltr"
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold shrink-0"
                    style={{ color: 'var(--teal, #00B4CC)' }}>
                    <Phone size={12} />{r.candidatePhone}
                  </a>
                )}
              </div>

              <div className="pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                <ApplicationTimeline
                  status={r.status}
                  appliedAt={r.applied_at}
                  updatedAt={r.updated_at}
                  placementDate={r.placement_date}
                  interview={r.interviewAt ? { scheduled_at: r.interviewAt } : null}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
