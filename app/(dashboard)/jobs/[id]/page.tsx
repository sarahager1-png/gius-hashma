import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, MapPin, Building2, Briefcase, CalendarDays, Clock, GraduationCap, ChevronLeft } from 'lucide-react'
import ApplyButton from './apply-button'
import InquiryButton from './inquiry-button'

const STATUS_PILL: Record<string, { bg: string; color: string; dot: string }> = {
  'פעילה':    { bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
  'מושהית':   { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  'אוישה':    { bg: '#EDE9FE', color: '#5B21B6', dot: '#7C3AED' },
  'בוטלה':    { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  'פג תוקפה': { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
}

const TYPE_CFG: Record<string, { bg: string; color: string; accent: string }> = {
  "סטאג'": { bg: '#EDE9FE', color: '#5B21B6', accent: '#7C3AED' },
  'חלקי':  { bg: '#E0F2FE', color: '#0369A1', accent: '#0EA5E9' },
  'מלא':   { bg: '#DCFCE7', color: '#166534', accent: '#22C55E' },
}

function fmt(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtShort(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isCandidate = profile?.role === 'מועמדת'

  const { data: job } = await service
    .from('jobs')
    .select('*, institutions(institution_name, city, institution_type, address, phone)')
    .eq('id', id)
    .single()
  if (!job) notFound()

  let alreadyApplied = false
  let alreadyInquired = false
  let candidateId: string | null = null
  if (isCandidate) {
    const { data: cand } = await service.from('candidates').select('id').eq('profile_id', user.id).single()
    if (cand) {
      candidateId = cand.id
      const { data: existing } = await service
        .from('applications').select('id').eq('job_id', id).eq('candidate_id', cand.id).maybeSingle()
      alreadyApplied = !!existing
      // check if already sent inquiry to this institution
      const { data: existingInquiry } = await service
        .from('candidate_inquiries')
        .select('id')
        .eq('candidate_id', cand.id)
        .eq('institution_id', job.institution_id)
        .maybeSingle()
      alreadyInquired = !!existingInquiry
    }
  }

  const ss = STATUS_PILL[job.status] ?? STATUS_PILL['בוטלה']
  const tc = TYPE_CFG[job.job_type ?? ''] ?? { bg: '#F3F4F6', color: '#6B7280', accent: '#9CA3AF' }
  const inst = job.institutions as { institution_name?: string; city?: string; institution_type?: string; address?: string; phone?: string } | undefined
  const hasDateRange = job.start_date || job.end_date

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      {/* Back */}
      <Link href="/jobs"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-6 transition-colors"
        style={{ color: 'var(--ink-3)' }}
        onMouseOver={() => {}} >
        <ArrowRight size={14} />חזרה למשרות
      </Link>

      {/* Hero card */}
      <div className="rounded-[20px] overflow-hidden mb-4"
        style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: '0 4px 32px rgba(15,11,35,.08)' }}>

        {/* Accent bar */}
        <div className="h-1.5 w-full" style={{ background: tc.accent }} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0"
              style={{ background: tc.bg }}>
              <Briefcase size={24} style={{ color: tc.accent }} />
            </div>
            {/* Title + badges */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-extrabold leading-snug" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
                {job.title}
              </h1>
              {inst?.institution_name && (
                <p className="text-[14px] font-semibold mt-0.5" style={{ color: 'var(--ink-3)' }}>
                  {inst.institution_name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: ss.bg, color: ss.color }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ss.dot }} />
                  {job.status}
                </span>
                {job.job_type && (
                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: tc.bg, color: tc.color }}>
                    {job.job_type}
                  </span>
                )}
                {job.specialization && (
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>
                    {job.specialization}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Date range — prominent block */}
          {hasDateRange && (
            <div className="mt-5 flex items-center gap-3 p-4 rounded-[12px]"
              style={{ background: 'linear-gradient(135deg, var(--purple-050) 0%, var(--teal-050) 100%)', border: '1px solid var(--purple-100)' }}>
              <CalendarDays size={20} style={{ color: 'var(--purple)', flexShrink: 0 }} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.07em] mb-0.5" style={{ color: 'var(--ink-3)' }}>
                  תקופת המשרה
                </p>
                <p className="text-[15px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
                  {fmtShort(job.start_date) ?? '—'}
                  <span className="mx-2" style={{ color: 'var(--ink-4)' }}>→</span>
                  {fmt(job.end_date) ?? '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="rounded-[16px] overflow-hidden mb-4"
        style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--bg)' }}>
          <p className="text-[11px] font-bold uppercase tracking-[.09em]" style={{ color: 'var(--ink-4)' }}>פרטי המשרה</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--line-soft)' }}>
          {inst?.city && <DetailRow icon={<MapPin size={15} />} label="מיקום" value={inst.city} />}
          {inst?.institution_name && <DetailRow icon={<Building2 size={15} />} label="מוסד" value={inst.institution_name} />}
          {inst?.institution_type && <DetailRow icon={<Briefcase size={15} />} label="סוג מוסד" value={inst.institution_type} />}
          {job.specialization && <DetailRow icon={<GraduationCap size={15} />} label="התמחות" value={job.specialization} />}
          {job.placement_type && <DetailRow icon={null} label="אופי המשרה" value={job.placement_type} />}
          <DetailRow
            icon={<Clock size={15} />}
            label="פורסם"
            value={fmt(job.created_at) ?? '—'}
          />
          {job.expires_at && (
            <DetailRow icon={<CalendarDays size={15} />} label="תוקף פרסום" value={fmt(job.expires_at) ?? '—'} />
          )}
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="rounded-[16px] overflow-hidden mb-4"
          style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--bg)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[.09em]" style={{ color: 'var(--ink-4)' }}>תיאור המשרה</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-2)' }}>
              {job.description}
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      {job.status === 'פעילה' && isCandidate && (
        <div className="space-y-3">
          <ApplyButton jobId={id} alreadyApplied={alreadyApplied} />
          <InquiryButton
            jobId={id}
            institutionName={inst?.institution_name ?? 'המוסד'}
            alreadySent={alreadyInquired}
          />
        </div>
      )}
      {job.status === 'פעילה' && !isCandidate && (
        <div className="rounded-[14px] p-4 flex items-center gap-3"
          style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#22C55E' }} />
          <span className="text-[14px] font-semibold" style={{ color: '#166534' }}>
            משרה זו פעילה ומקבלת הגשות
          </span>
          <Link href="/jobs"
            className="ms-auto flex items-center gap-1 text-[13px] font-bold"
            style={{ color: '#166534' }}>
            כל המשרות <ChevronLeft size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="w-5 shrink-0 flex items-center justify-center" style={{ color: 'var(--ink-4)' }}>{icon}</span>
      <span className="text-[13px] font-medium w-28 shrink-0" style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}
