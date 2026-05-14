import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Phone, MessageCircle } from 'lucide-react'
import InviteButton from './invite-button'
import SendMessageButton from './send-message-button'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type WorkEntry = { workplace: string; manager: string }

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4" style={{ borderTop: '1px solid var(--line)' }}>
      <p className="text-[10px] font-bold uppercase tracking-[.12em] mb-3" style={{ color: 'var(--ink-4)' }}>{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CardRow({ label, value, ltr }: { label: string; value?: string | null; ltr?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="text-[12px] font-semibold shrink-0 w-24" style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: 'var(--ink)', direction: ltr ? 'ltr' : undefined }}>{value}</span>
    </div>
  )
}

function SkillTags({ value }: { value?: string | null }) {
  const items = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(s => <span key={s} className="px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold" style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>{s}</span>)}
    </div>
  )
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: viewerProfile } = await service
    .from('profiles').select('role').eq('id', user.id).single()

  const allowed = ['מנהלת מערכת', 'אדמין מערכת', 'מוסד']
  if (!viewerProfile || !allowed.includes(viewerProfile.role)) redirect('/dashboard')

  const { data: candidate } = await service
    .from('candidates')
    .select('*, profiles(full_name, phone)')
    .eq('id', id)
    .single()
  if (!candidate) notFound()

  // For institution viewers: load their active jobs
  let institutionForInvite: { id: string; institution_name: string } | null = null
  let activeJobsForInvite: { id: string; title: string }[] = []
  if (viewerProfile.role === 'מוסד') {
    const { data: inst } = await service
      .from('institutions')
      .select('id, institution_name, is_approved')
      .eq('profile_id', user.id)
      .single()
    if (inst?.is_approved) {
      institutionForInvite = inst
      const { data: jobsData } = await service
        .from('jobs')
        .select('id, title')
        .eq('institution_id', inst.id)
        .eq('status', 'פעילה')
        .order('created_at', { ascending: false })
      activeJobsForInvite = (jobsData ?? []) as { id: string; title: string }[]
    }
  }

  type ProfileRow = { full_name?: string | null; phone?: string | null }
  const name    = (candidate.profiles as ProfileRow | null)?.full_name ?? '—'
  const phone   = (candidate.profiles as ProfileRow | null)?.phone ?? null
  const initials = name !== '—' ? name.split(' ').slice(0, 2).map((w: string) => w[0]).join('') : '?'
  const backHref = viewerProfile.role === 'מוסד' ? '/institution/candidates' : '/candidates'

  const waLink = phone ? (() => {
    const n = phone.replace(/\D/g, '').replace(/^0/, '972')
    const t = encodeURIComponent(`שלום ${name.split(' ')[0]}, ראינו את הפרופיל שלך במערכת הגיוס של רשת חינוך חב"ד ונשמח לדבר.`)
    return `https://wa.me/${n}?text=${t}`
  })() : null

  const workHistory: WorkEntry[] = Array.isArray(candidate.experiences)
    ? (candidate.experiences as WorkEntry[]).filter(e => e?.workplace?.trim())
    : []

  const showExperience = ['סטאג׳', "שנה ב' - סטאג'", "שנה ג' - סטאג'"].includes(candidate.academic_level ?? '')

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      <Link href={backHref}
        className="inline-flex items-center gap-2 text-[13px] font-semibold mb-6 no-underline"
        style={{ color: 'var(--ink-3)' }}>
        <ArrowRight size={14} />חזרה למועמדות
      </Link>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>

        {/* Header */}
        <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #3B1F6E 0%, #5B3AAB 100%)' }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-black shrink-0"
              style={{ background: 'rgba(255,255,255,.18)', color: '#fff', letterSpacing: '-.02em' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[19px] font-black text-white leading-tight">{name}</h1>
              {candidate.specialization && (
                <p className="text-[13px] font-semibold mt-1" style={{ color: 'rgba(255,255,255,.8)' }}>{candidate.specialization}</p>
              )}
            </div>
          </div>

          {candidate.availability_status && (
            <div className="mt-4">
              <span className="inline-block px-3 py-1 rounded-full text-[11.5px] font-bold"
                style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
                {candidate.availability_status}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {phone && (
              <a href={`tel:${phone}`}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[12.5px] font-bold no-underline"
                style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.25)' }}>
                <Phone size={13} />{phone}
              </a>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[12.5px] font-bold no-underline"
                style={{ background: '#25D366', color: '#fff' }}>
                <MessageCircle size={13} />וואצאפ
              </a>
            )}
            {institutionForInvite && (
              <InviteButton
                candidateId={id}
                candidateName={name}
                candidatePhone={phone}
                institutionId={institutionForInvite.id}
                institutionName={institutionForInvite.institution_name}
                activeJobs={activeJobsForInvite}
              />
            )}
            {viewerProfile.role === 'מוסד' && institutionForInvite && candidate.profile_id && (
              <SendMessageButton
                toCandidateName={name}
                toProfileId={candidate.profile_id as string}
                jobOptions={activeJobsForInvite}
              />
            )}
          </div>
        </div>

        {/* Personal */}
        <CardSection title="פרטים אישיים">
          <CardRow label="טלפון" value={phone} ltr />
          <CardRow label="עיר / ישוב" value={candidate.city} />
          <CardRow label="כתובת" value={candidate.address} />
          <CardRow label="מחוז" value={candidate.district} />
          <CardRow label="שנת לידה" value={candidate.birth_year ? String(candidate.birth_year) : null} />
          <CardRow label="מצב משפחתי" value={candidate.marital_status} />
        </CardSection>

        {/* Availability */}
        {(candidate.availability_from || candidate.availability_to) && (
          <CardSection title="זמינות">
            <CardRow label="מ-" value={candidate.availability_from} ltr />
            <CardRow label="עד-" value={candidate.availability_to} ltr />
          </CardSection>
        )}

        {/* Shlichut */}
        {(candidate.shlichut_location || candidate.shlichut_years || candidate.study_day) && (
          <CardSection title="שליחות">
            <CardRow label="מיקום" value={candidate.shlichut_location} />
            <CardRow label="שנים" value={candidate.shlichut_years} />
            <CardRow label="יום לימוד" value={candidate.study_day} />
          </CardSection>
        )}

        {/* Academic */}
        {(candidate.college || candidate.academic_level || candidate.graduation_year || candidate.seniority_years) && (
          <CardSection title="הכשרה אקדמית">
            <CardRow label="מוסד" value={candidate.college} />
            <CardRow label="רמה" value={candidate.academic_level} />
            <CardRow label="שנת סיום" value={candidate.graduation_year ? String(candidate.graduation_year) : null} />
            <CardRow label="ותק" value={candidate.seniority_years ? `${candidate.seniority_years} שנים` : null} />
            {showExperience && <CardRow label="שנות ניסיון" value={candidate.years_experience ? String(candidate.years_experience) : null} />}
          </CardSection>
        )}

        {/* Work history */}
        {(workHistory.length > 0 || candidate.past_projects) && (
          <CardSection title="ניסיון">
            {workHistory.length > 0 && (
              <div className="space-y-2">
                {workHistory.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[12px] font-semibold shrink-0 w-24" style={{ color: 'var(--ink-3)' }}>מקום {i + 1}</span>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{e.workplace}</p>
                      {e.manager && <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>מנהלת: {e.manager}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {candidate.past_projects && (
              <div className={workHistory.length > 0 ? 'mt-2' : ''}>
                <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-3)' }}>פרויקטים נוספים</p>
                <p className="text-[13px] whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{candidate.past_projects}</p>
              </div>
            )}
          </CardSection>
        )}

        {/* Skills */}
        {(candidate.technical_skills || candidate.interpersonal_skills || candidate.special_skills) && (
          <CardSection title="כישורים">
            {candidate.technical_skills && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>מקצועיים</p>
                <SkillTags value={candidate.technical_skills} />
              </div>
            )}
            {candidate.interpersonal_skills && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>בין-אישיים</p>
                <SkillTags value={candidate.interpersonal_skills} />
              </div>
            )}
            {candidate.special_skills && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>מיוחדים</p>
                <SkillTags value={candidate.special_skills} />
              </div>
            )}
          </CardSection>
        )}

        {/* Bio */}
        {(candidate.bio || candidate.personal_note) && (
          <CardSection title="ביטוי אישי">
            {candidate.bio && <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{candidate.bio}</p>}
            {candidate.personal_note && <p className="text-[12px] mt-2" style={{ color: 'var(--ink-3)' }}>{candidate.personal_note}</p>}
          </CardSection>
        )}

        {/* Footer */}
        {candidate.whatsapp_preference !== undefined && (
          <div className="px-6 py-4" style={{ borderTop: '1px solid var(--line)' }}>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-4)' }}>
              עדכונים דרך: {candidate.whatsapp_preference ? 'WhatsApp' : 'SMS'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
