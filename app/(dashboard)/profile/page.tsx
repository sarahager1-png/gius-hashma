import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Briefcase, CheckCircle, Eye, XCircle, Clock, Sparkles, Bell, ClipboardList, Search, CalendarCheck, Trophy, MessageCircle } from 'lucide-react'
import ProfileFormClient from './profile-form-client'
import StatusWidget from './status-widget'

const APP_STATUS_CFG: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  'ממתינה': { bg: '#EDE9FE', color: '#5B21B6', icon: <Clock size={12} /> },
  'נצפתה':  { bg: '#E0F2FE', color: '#0369A1', icon: <Eye size={12} /> },
  'התקבלה': { bg: '#DCFCE7', color: '#166534', icon: <CheckCircle size={12} /> },
  'נדחתה':  { bg: '#FEE2E2', color: '#B91C1C', icon: <XCircle size={12} /> },
  'בוטלה':  { bg: '#F4F4F5', color: '#71717A', icon: <XCircle size={12} /> },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles').select('*').eq('id', user.id).single()
  const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']
  const isAdmin = profile && ADMIN_ROLES.includes(profile.role)
  if (!profile || (profile.role !== 'מועמדת' && !isAdmin)) redirect('/dashboard')

  const { data: candidate } = await service
    .from('candidates').select('*').eq('profile_id', user.id).single()

  // fetch recent applications with job + institution info
  const { data: appsRaw } = candidate
    ? await service
        .from('applications')
        .select('id, status, applied_at, jobs(title, city, institutions(institution_name))')
        .eq('candidate_id', candidate.id)
        .order('applied_at', { ascending: false })
        .limit(12)
    : { data: [] }

  const apps = (appsRaw ?? []) as unknown as Array<{
    id: string; status: string; applied_at: string;
    jobs: { title: string; city: string | null; institutions: { institution_name: string } | null } | null
  }>

  return (
    <div className="p-4 md:p-8 max-w-2xl" dir="rtl">
      {isAdmin && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-semibold"
          style={{ background: '#FFF7E6', border: '1px solid #F8C94C', color: '#92600A' }}>
          <Eye size={14} />
          תצוגת אדמין — כך נראה הפרופיל למועמדת
        </div>
      )}

      {!isAdmin && candidate?.availability_status && (
        <StatusWidget status={candidate.availability_status} />
      )}

      <h1 className="page-title mb-1">הפרופיל שלי</h1>
      <span className="brand-line mb-6 block" />

      {/* Welcome guide — shown only to new candidates with no applications */}
      {!isAdmin && apps.length === 0 && (!candidate?.city || !candidate?.specialization) && (
        <div className="mb-6 rounded-[16px] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #EFF8FF 100%)', border: '1.5px solid #DDD6FE' }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} style={{ color: 'var(--purple)' }} />
              <span className="text-[15px] font-extrabold" style={{ color: 'var(--purple)' }}>ברוכה הבאה למערכת השביל!</span>
            </div>
            <p className="text-[13px] mb-4" style={{ color: 'var(--ink-3)' }}>
              מערכת השביל מחברת בין מועמדות מצוינות לבין בתי ספר ברשת חינוך חב&quot;ד ברחבי הארץ.
              כך נראה התהליך מתחילתו ועד סופו:
            </p>

            {/* Step-by-step process */}
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute right-[13px] top-7 bottom-7 w-px" style={{ background: '#DDD6FE' }} />

              <div className="space-y-4 mb-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: 'var(--purple)', color: '#fff', fontSize: '11px', fontWeight: 800 }}>1</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>מלאי את הפרופיל שלך</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>ככל שתוסיפי יותר פרטים — עיר, התמחות, ניסיון — כך המערכת תמצא לך התאמות טובות יותר</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#7C3AED', color: '#fff', fontSize: '11px', fontWeight: 800 }}>2</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>קבלי התראות על משרות מתאימות</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>תקבלי הודעה בוואטסאפ כשתיפתח משרה שמתאימה לפרופיל שלך. תוכלי גם לחפש משרות בעצמך</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#0369A1', color: '#fff', fontSize: '11px', fontWeight: 800 }}>3</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>הגישי מועמדות או פתחי פנייה</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>הגישי מועמדות למשרה פתוחה, או צרי קשר ישירות עם בית הספר שמעניין אותך</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#0891B2', color: '#fff', fontSize: '11px', fontWeight: 800 }}>4</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>ראיון עם בית הספר</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>כשבית ספר מתעניין בך, תקבלי הזמנה לראיון. תוכלי לתאם מועד ישירות דרך המערכת</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#166534', color: '#fff', fontSize: '11px', fontWeight: 800 }}>5</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>קבלה ותחילת עבודה 🎉</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>לאחר אישור הקבלה, המערכת תעדכן את הסטטוס שלך ותהיי בקשר עם צוות הרשת לכל שאלה</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ongoing note */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] mb-2"
              style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid #DDD6FE' }}>
              <span className="text-[14px] shrink-0 mt-0.5">🔄</span>
              <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                <span className="font-bold" style={{ color: 'var(--purple)' }}>המערכת תמיד פתוחה עבורך — </span>
                גם לאחר סיום תקופת עבודה, שנת לימודים או סטאג׳, תוכלי לעדכן את הפרופיל ולהגיש מועמדות מחדש למשרות חדשות
              </p>
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] mb-3"
              style={{ background: 'rgba(3,105,161,0.06)', border: '1px solid #BAE6FD' }}>
              <span className="text-[14px] shrink-0 mt-0.5">💬</span>
              <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                <span className="font-bold" style={{ color: '#0369A1' }}>עדכון שבועי — </span>
                אחת לשבוע נשלח לך הודעה בוואטסאפ עם משרות מתאימות ונשאל אם את עדיין מחפשת. ענו <strong>כן</strong> או <strong>לא</strong> — ואנחנו נעדכן את הסטטוס שלך בהתאם
              </p>
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-2 flex-wrap">
            <Link href="/jobs"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-[10px] no-underline"
              style={{ background: 'var(--purple)', color: '#fff' }}>
              <Search size={13} />
              גלי משרות פתוחות
            </Link>
            <Link href="/institutions"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-[10px] no-underline"
              style={{ background: '#EDE9FE', color: 'var(--purple)' }}>
              <MessageCircle size={13} />
              פנייה למוסד
            </Link>
          </div>
        </div>
      )}

      <ProfileFormClient profile={profile} candidate={candidate} />

      {/* Applications history */}
      {apps.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-extrabold" style={{ color: 'var(--ink)', letterSpacing: '-.01em' }}>
              היסטוריית הגשות
            </h2>
            <Link href="/my-applications"
              className="text-[13px] font-semibold"
              style={{ color: 'var(--purple)' }}>
              כל ההגשות ←
            </Link>
          </div>

          <div className="space-y-2">
            {apps.map(app => {
              const cfg = APP_STATUS_CFG[app.status] ?? APP_STATUS_CFG['בוטלה']
              const job = app.jobs as typeof app.jobs
              return (
                <div key={app.id}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-[12px]"
                  style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--purple-050)' }}>
                    <Briefcase size={15} style={{ color: 'var(--purple)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold truncate" style={{ color: 'var(--ink)' }}>
                      {job?.title ?? '—'}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: 'var(--ink-3)' }}>
                      {job?.institutions?.institution_name ?? ''}
                      {job?.city ? ` · ${job.city}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon}{app.status}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                      {fmt(app.applied_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
