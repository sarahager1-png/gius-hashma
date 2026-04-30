import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowRight, MapPin, Phone, GraduationCap, BookOpen,
  Briefcase, Calendar, MessageCircle, Building2, FileText,
} from 'lucide-react'

const AVAIL_PILL: Record<string, { bg: string; color: string; dot: string }> = {
  "מחפשת סטאג'":       { bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  'פתוחה להצעות':       { bg: '#DDFAFB', color: '#007A84', dot: '#00BCC8' },
  'משובצת':             { bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
  'בוגרת מחפשת משרה':  { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  'לא פעילה':           { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: viewerProfile } = await service
    .from('profiles').select('role').eq('id', user.id).single()

  const allowed = ['מנהל רשת', 'אדמין מערכת', 'מוסד']
  if (!viewerProfile || !allowed.includes(viewerProfile.role)) redirect('/dashboard')

  const { data: candidate } = await service
    .from('candidates')
    .select('*, profiles(full_name, phone)')
    .eq('id', id)
    .single()
  if (!candidate) notFound()

  const { count: appsCount } = await service
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', id)

  const name     = (candidate.profiles as any)?.full_name ?? '—'
  const phone    = (candidate.profiles as any)?.phone ?? null
  const initials = name !== '—' ? name.split(' ').slice(0, 2).map((w: string) => w[0]).join('') : '?'
  const sc       = AVAIL_PILL[candidate.availability_status] ?? AVAIL_PILL['לא פעילה']
  const isStage  = ["שנה ב' - סטאג'", "שנה ג' - סטאג'", "סטאג'"].includes(candidate.academic_level ?? '')
  const backHref = viewerProfile.role === 'מוסד' ? '/institution/candidates' : '/candidates'

  const waLink = phone ? (() => {
    const n = phone.replace(/\D/g, '').replace(/^0/, '972')
    const t = encodeURIComponent(`שלום ${name.split(' ')[0]}, ראינו את הפרופיל שלך במערכת הגיוס של רשת חינוך חב"ד ונשמח לדבר.`)
    return `https://wa.me/${n}?text=${t}`
  })() : null

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      <Link href={backHref}
        className="inline-flex items-center gap-2 text-[13px] font-semibold mb-6 no-underline transition-colors"
        style={{ color: 'var(--ink-3)' }}>
        <ArrowRight size={14} />חזרה למועמדות
      </Link>

      {/* Hero card */}
      <div className="rounded-[20px] overflow-hidden mb-4"
        style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: '0 4px 24px rgba(15,11,35,.08)' }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--purple), var(--teal))' }} />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--purple), var(--teal))' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.02em' }}>
                {name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: sc.bg, color: sc.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                  {candidate.availability_status}
                </span>
                {candidate.city && (
                  <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--ink-3)' }}>
                    <MapPin size={12} />{candidate.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact buttons */}
          {(phone || waLink) && (
            <div className="flex gap-3 mt-5 flex-wrap">
              {phone && (
                <a href={`tel:${phone}`}
                  className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold no-underline transition-all"
                  style={{ background: 'var(--bg-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
                  <Phone size={15} />{phone}
                </a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13.5px] font-bold text-white no-underline transition-all"
                  style={{ background: '#25D366', boxShadow: '0 3px 12px rgba(37,211,102,.3)' }}>
                  <MessageCircle size={15} />וואצאפ
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Study day — highlighted */}
      {(candidate as any).study_day && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-[14px] mb-4"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A', boxShadow: 'var(--shadow-sm)' }}>
          <BookOpen size={18} style={{ color: '#D97706', flexShrink: 0 }} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.07em]" style={{ color: '#92400E' }}>יום לימודים</p>
            <p className="text-[14px] font-extrabold" style={{ color: '#78350F' }}>{(candidate as any).study_day}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Academic */}
        <Section title="השכלה ורמה אקדמית">
          <Row icon={<GraduationCap size={15} />} label="רמה"       value={candidate.academic_level ?? '—'} />
          <Row icon={<Building2 size={15} />}     label="מכללה"     value={candidate.college ?? '—'} />
          {candidate.graduation_year && (
            <Row icon={<Calendar size={15} />} label="שנת סיום" value={String(candidate.graduation_year)} />
          )}
          {candidate.specialization && (
            <Row icon={<Briefcase size={15} />} label="התמחות" value={candidate.specialization} />
          )}
        </Section>

        {/* Stage / Experience */}
        {isStage ? (
          <Section title="פרטי סטאג׳">
            <Row icon={<MapPin size={15} />} label="מקום שליחות" value={candidate.placement_location ?? 'לא צוין'} />
          </Section>
        ) : (candidate.prev_employer || candidate.prev_role || candidate.years_experience) ? (
          <Section title="ניסיון קודם">
            {candidate.prev_role     && <Row icon={<Briefcase size={15} />} label="תפקיד"      value={candidate.prev_role} />}
            {candidate.prev_employer && <Row icon={<Building2 size={15} />} label="מקום עבודה" value={candidate.prev_employer} />}
            {!!candidate.years_experience && (
              <Row icon={<Calendar size={15} />} label="שנות ניסיון" value={`${candidate.years_experience} שנים`} />
            )}
          </Section>
        ) : null}

        {/* Availability */}
        {(candidate.availability_from || candidate.availability_to) && (
          <Section title="זמינות">
            {candidate.availability_from && <Row icon={<Calendar size={15} />} label="מ-" value={new Date(candidate.availability_from).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} />}
            {candidate.availability_to   && <Row icon={<Calendar size={15} />} label="עד" value={new Date(candidate.availability_to).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} />}
          </Section>
        )}

        {/* Skills */}
        {(candidate.technical_skills || candidate.interpersonal_skills) && (
          <Section title="כישורים">
            {candidate.technical_skills    && <TextBlock label="מקצועיים" text={candidate.technical_skills} />}
            {candidate.interpersonal_skills && <TextBlock label="בין-אישיים" text={candidate.interpersonal_skills} />}
          </Section>
        )}

        {/* Bio / personal note */}
        {(candidate.bio || candidate.personal_note) && (
          <Section title="אודות">
            {candidate.bio          && <TextBlock label="ביוגרפיה" text={candidate.bio} />}
            {candidate.personal_note && <TextBlock label="הערה אישית" text={candidate.personal_note} />}
          </Section>
        )}

        {/* CV link */}
        {candidate.cv_url && (
          <div className="rounded-[14px] border p-4 flex items-center gap-3"
            style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <FileText size={18} style={{ color: 'var(--purple)', flexShrink: 0 }} />
            <a href={candidate.cv_url} target="_blank" rel="noreferrer"
              className="text-[14px] font-bold no-underline"
              style={{ color: 'var(--purple)' }}>
              קורות חיים ↗
            </a>
          </div>
        )}

        {/* Stats */}
        {viewerProfile.role !== 'מוסד' && (
          <Section title="נתונים">
            <Row icon={<Briefcase size={15} />} label="הגשות" value={`${appsCount ?? 0}`} />
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] overflow-hidden"
      style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--bg)' }}>
        <p className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--ink-4)' }}>{title}</p>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 shrink-0 flex justify-center" style={{ color: 'var(--ink-4)' }}>{icon}</span>
      <span className="text-[13px] font-medium w-28 shrink-0" style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}

function TextBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-bold uppercase tracking-[.06em] mb-1.5" style={{ color: 'var(--ink-4)' }}>{label}</p>
      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-2)' }}>{text}</p>
    </div>
  )
}
