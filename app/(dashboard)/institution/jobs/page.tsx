import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Job } from '@/lib/types'
import Link from 'next/link'
import { Sparkles, ClipboardList, Users, CalendarCheck, CheckCircle, MessageCircle } from 'lucide-react'
import JobsListClient from './jobs-list-client'

const ADMIN_ROLES = ['מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת']

export default async function InstitutionJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: viewerProfile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = viewerProfile && ADMIN_ROLES.includes(viewerProfile.role)

  if (isAdmin) redirect('/admin/institutions')

  const { data: institution } = await service.from('institutions').select('id, institution_name, is_approved').eq('profile_id', user.id).single()

  if (!institution) redirect('/institution/profile')
  if (!institution.is_approved) redirect('/institution/profile')

  type JobWithApps = Job & { applications?: { count: number }[] }

  const { data } = await service
    .from('jobs')
    .select('*, applications(count)')
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })
  const jobs = (data ?? []) as JobWithApps[]

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold" style={{ color: 'var(--purple)', letterSpacing: '-.01em' }}>
            המשרות שלי
          </h1>
          <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--ink-3)' }}>
            {institution.institution_name} · {jobs.length} משרות
          </p>
        </div>
        <Link href="/institution/jobs/new"
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white no-underline"
          style={{ background: 'var(--purple)' }}>
          + משרה חדשה
        </Link>
      </div>
      {/* Welcome guide — shown only when no jobs yet */}
      {jobs.length === 0 && (
        <div className="mb-6 rounded-[16px] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F5F0FF 0%, #FFF7ED 100%)', border: '1.5px solid #DDD6FE' }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} style={{ color: 'var(--purple)' }} />
              <span className="text-[15px] font-extrabold" style={{ color: 'var(--purple)' }}>ברוכים הבאים למערכת השביל!</span>
            </div>
            <p className="text-[13px] mb-4" style={{ color: 'var(--ink-3)' }}>
              מערכת השביל מסייעת לבתי הספר ברשת חינוך חב&quot;ד למצוא מועמדות מתאימות בצורה מהירה ויעילה.
              כך נראה התהליך:
            </p>

            <div className="relative">
              <div className="absolute right-[13px] top-7 bottom-7 w-px" style={{ background: '#DDD6FE' }} />
              <div className="space-y-4 mb-4">

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: 'var(--purple)', color: '#fff', fontSize: '11px', fontWeight: 800 }}>1</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>פרסמי משרה פתוחה</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>הוסיפי את פרטי התפקיד — שעות, התמחות, עיר — והמשרה תתפרסם מיד לכלל המועמדות המתאימות</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#7C3AED', color: '#fff', fontSize: '11px', fontWeight: 800 }}>2</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>קבלי מועמדות והתאמות</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>המערכת תשלח לך הודעה בוואטסאפ כשמועמדת מגישה מועמדות או כשנמצאה התאמה חדשה לפרופיל שלך</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#0369A1', color: '#fff', fontSize: '11px', fontWeight: 800 }}>3</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>עיינו בפרופיל המועמדות</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>צפי בפרטי המועמדת — ניסיון, השכלה, עיר — ושלחי הזמנה לראיון למי שמתאימה</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#0891B2', color: '#fff', fontSize: '11px', fontWeight: 800 }}>4</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>ראיון — תאום מועד דרך המערכת</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>שלחי הזמנה לראיון עם מועד מוצע, המועמדת תאשר ישירות מהמכשיר שלה</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: '#166534', color: '#fff', fontSize: '11px', fontWeight: 800 }}>5</div>
                  <div className="pb-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>קבלה ועדכון סטטוס 🎉</p>
                    <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>לאחר בחירת המועמדת, עדכני את המשרה לסגורה — צוות הרשת יטפל בהמשך האדמיניסטרטיבי</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] mb-2"
              style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid #DDD6FE' }}>
              <span className="text-[14px] shrink-0 mt-0.5">🔄</span>
              <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                <span className="font-bold" style={{ color: 'var(--purple)' }}>תמיד אפשר לחזור — </span>
                בכל תחילת שנה, עזיבת עובדת או צורך חדש, פתחי משרה חדשה ותתחילי את התהליך מחדש. הפרופיל שלך נשמר
              </p>
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] mb-3"
              style={{ background: 'rgba(3,105,161,0.06)', border: '1px solid #BAE6FD' }}>
              <span className="text-[14px] shrink-0 mt-0.5">💬</span>
              <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                <span className="font-bold" style={{ color: '#0369A1' }}>עדכון שבועי — </span>
                אחת לשבוע נשלח לכם הודעה בוואטסאפ עם מועמדות חדשות מתאימות ונשאל אם אתם עדיין מגייסים. ענו <strong>כן</strong> או <strong>לא</strong> — ואנחנו נדאג לשאר
              </p>
            </div>
          </div>

          <div className="px-5 pb-5 flex gap-2 flex-wrap">
            <Link href="/institution/jobs/new"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-[10px] no-underline"
              style={{ background: 'var(--purple)', color: '#fff' }}>
              <ClipboardList size={13} />
              פרסמי משרה ראשונה
            </Link>
            <Link href="/candidates"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-[10px] no-underline"
              style={{ background: '#EDE9FE', color: 'var(--purple)' }}>
              <Users size={13} />
              גלי מועמדות
            </Link>
          </div>
        </div>
      )}

      <JobsListClient jobs={jobs} />
    </div>
  )
}
