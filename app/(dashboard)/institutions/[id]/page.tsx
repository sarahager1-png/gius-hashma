import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Clock, MapPin, Building2, Phone, Briefcase, MessageCircle } from 'lucide-react'

export default async function InstitutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['מנהל רשת', 'אדמין מערכת', 'מועמדת'].includes(profile.role)) redirect('/dashboard')

  const { data: institution } = await service
    .from('institutions')
    .select('*, profiles(full_name, phone)')
    .eq('id', id)
    .single()
  if (!institution) notFound()

  // מועמדת לא רואה מוסד לא מאושר
  if (profile.role === 'מועמדת' && !institution.is_approved) redirect('/institutions')

  const { count } = await service
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', id)
  const jobsCount = count ?? 0

  const initials = institution.institution_name.slice(0, 2)
  const instPhone = institution.phone ?? (institution.profiles as { phone?: string | null } | null)?.phone ?? ''

  // כפתורי פנייה למועמדת
  const candidateName = profile.role === 'מועמדת' ? (profile.full_name ?? '') : ''
  const waText = instPhone
    ? encodeURIComponent(`שלום,\nשמי ${candidateName} ואני מועמדת בתחום החינוך.\nמצאתי את "${institution.institution_name}" ומעוניינת לשמוע על אפשרויות עבודה.\nתודה!`)
    : ''
  const normalizedPhone = instPhone.replace(/\D/g, '').replace(/^0/, '972')
  const waLink = instPhone ? `https://wa.me/${normalizedPhone}?text=${waText}` : null

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <Link href="/institutions" className="inline-flex items-center gap-2 text-[13px] font-semibold mb-6"
        style={{ color: 'var(--purple)' }}>
        <ArrowRight size={15} />חזרה למוסדות
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-extrabold shrink-0"
          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-[24px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
            {institution.institution_name}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {institution.is_approved ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#E4F6ED', color: '#1A7A4A' }}>
                <CheckCircle size={11} />פעיל
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#FDF3E3', color: 'var(--amber)' }}>
                <Clock size={11} />ממתין לאישור
              </span>
            )}
            {institution.institution_type && (
              <span className="text-[13px] font-medium" style={{ color: 'var(--ink-3)' }}>
                {institution.institution_type}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <InfoCard title="פרטי מוסד">
          <InfoRow icon={<MapPin size={15} />} label="עיר"            value={institution.city ?? '—'} />
          <InfoRow icon={<Building2 size={15} />} label="כתובת"       value={institution.address ?? '—'} />
          <InfoRow icon={<Briefcase size={15} />} label="משרות במערכת" value={`${jobsCount}`} />
        </InfoCard>

        <InfoCard title="איש קשר">
          <InfoRow icon={null} label="שם"    value={(institution.profiles as { full_name?: string | null } | null)?.full_name ?? '—'} />
          <InfoRow icon={<Phone size={15} />} label="טלפון" value={instPhone || '—'} />
        </InfoCard>

        {/* כפתורי יצירת קשר — למועמדות בלבד */}
        {profile.role === 'מועמדת' && instPhone && (
          <div className="rounded-[14px] border p-5"
            style={{ background: '#F9F8FF', borderColor: '#DDD6FE', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="text-[12px] font-bold uppercase tracking-[.08em] mb-4" style={{ color: 'var(--purple)' }}>
              צרי קשר עם המוסד
            </h3>
            <p className="text-[13px] mb-4" style={{ color: 'var(--ink-3)' }}>
              שלחי הודעה ישירה להתעניין במשרות פנויות
            </p>
            <div className="flex gap-3 flex-wrap">
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-bold text-white transition-all"
                  style={{ background: '#25D366' }}>
                  <MessageCircle size={16} />שלחי וואצאפ
                </a>
              )}
              <a href={`tel:${instPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-bold transition-all"
                style={{ background: 'var(--purple-050)', color: 'var(--purple)', border: '1px solid #DDD6FE' }}>
                <Phone size={16} />התקשרי
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border p-5"
      style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 className="text-[12px] font-bold uppercase tracking-[.08em] mb-4" style={{ color: 'var(--ink-3)' }}>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon
        ? <span className="w-5 shrink-0" style={{ color: 'var(--ink-4)' }}>{icon}</span>
        : <span className="w-5 shrink-0" />}
      <span className="text-[13px] font-medium w-28 shrink-0" style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}
