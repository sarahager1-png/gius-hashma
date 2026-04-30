import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { HelpCircle, CheckCircle2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const GUIDES: Record<string, { title: string; subtitle: string; steps: Step[]; tips: string[] }> = {
  'מועמדת': {
    title: 'מדריך למועמדת',
    subtitle: 'כל מה שצריך לדעת כדי למצוא שיבוץ',
    steps: [
      {
        num: 1, color: '#5B3E9E', bg: '#EDE9FE',
        title: 'השלמת הפרופיל',
        body: 'הפרופיל שלך הוא הכרטיס ביקור שלך. חשוב במיוחד למלא: מחוז מגורים, התמחות (יסודי / חט"ב וכו\'), וסטטוס זמינות — אלה הנתונים שעל פיהם המערכת מחשבת התאמות.',
        link: '/profile', linkLabel: 'לפרופיל שלי ←',
      },
      {
        num: 2, color: '#0F766E', bg: '#CCFBF1',
        title: 'עיון במשרות',
        body: 'כנסי ל"משרות" וסנני לפי עיר, מחוז או התמחות. כשמצאת משרה מתאימה — לחצי "הגישי מועמדות" וצרפי מכתב כוונות אם רוצה.',
        link: '/jobs', linkLabel: 'למשרות פעילות ←',
      },
      {
        num: 3, color: '#B45309', bg: '#FDF3E3',
        title: 'מעקב הגשות',
        body: 'ב"הגשות שלי" תוכלי לראות את סטטוס כל הגשה: ממתינה / נצפתה / התקבלה / נדחתה. כשמוסד מגיב תקבלי התראה בפעמון.',
        link: '/my-applications', linkLabel: 'לגשות שלי ←',
      },
      {
        num: 4, color: '#1565C0', bg: '#DBEAFE',
        title: 'הזמנות לראיון',
        body: 'מוסד יכול להזמין אותך לראיון ישירות — גם ללא הגשה מצדך. תקבלי התראה, ובדף "הזמנות לראיון" תוכלי לאשר או לדחות.',
        link: '/my-invitations', linkLabel: 'להזמנות ←',
      },
      {
        num: 5, color: '#1A7A4A', bg: '#E4F6ED',
        title: 'פנייה ישירה למוסד',
        body: 'רוצה לפנות למוסד ספציפי? כנסי ל"מוסדות", בחרי מוסד — ותמצאי כפתורי וואצאפ ושיחה לפנייה ישירה.',
        link: '/institutions', linkLabel: 'למוסדות ←',
      },
    ],
    tips: [
      'פרופיל מלא = סיכוי גבוה יותר להתאמה אוטומטית',
      'עדכני סטטוס זמינות כשמתאימה לך עבודה',
      'ניתן להגיש לאותה משרה פעם אחת בלבד',
    ],
  },

  'מוסד': {
    title: 'מדריך למוסד חינוך',
    subtitle: 'כיצד לפרסם משרות ולמצוא מועמדות',
    steps: [
      {
        num: 1, color: '#5B3E9E', bg: '#EDE9FE',
        title: 'פרסום משרה',
        body: 'לחצי על "משרות" ואז "משרה חדשה". מלאי כותרת, עיר, מחוז, סוג משרה ותיאור. ככל שהפרטים מלאים יותר — כך יגיעו מועמדות מתאימות יותר.',
        link: '/institution/jobs', linkLabel: 'למשרות שלי ←',
      },
      {
        num: 2, color: '#0F766E', bg: '#CCFBF1',
        title: 'חיפוש מועמדות',
        body: 'ב"מועמדות" תמצאי את כל המועמדות הזמינות. ניתן לסנן לפי סטטוס, לחפש לפי שם/עיר, ולצפות בפרופיל המלא של כל מועמדת.',
        link: '/institution/candidates', linkLabel: 'למועמדות ←',
      },
      {
        num: 3, color: '#B45309', bg: '#FDF3E3',
        title: 'הזמנה לראיון',
        body: 'על כרטיס מועמדת תמצאי 2 אפשרויות: "הזמינה לראיון" (שולח הזמנה רשמית + וואצאפ) או כפתור וואצאפ ישיר לפנייה לא רשמית.',
        link: '/institution/candidates', linkLabel: 'למאגר מועמדות ←',
      },
      {
        num: 4, color: '#1565C0', bg: '#DBEAFE',
        title: 'ניהול מועמדויות',
        body: 'ב"היסטוריה" תראי את כל הפעילות — הגשות שהתקבלו, הזמנות ששלחת, ראיונות שנקבעו. ניתן לשנות סטטוס הגשה לקבלה/דחייה.',
        link: '/history', linkLabel: 'להיסטוריה ←',
      },
    ],
    tips: [
      'משרה עם מחוז מוגדר תקבל התאמות אוטומטיות',
      'ניתן לשנות סטטוס משרה ל"מושהית" זמנית',
      'הזמנה לראיון שומרת תיעוד במערכת לכל הצדדים',
    ],
  },

  'מנהל רשת': {
    title: 'מדריך למנהל מערכת',
    subtitle: 'ניהול מלא של מועמדות, מוסדות ושיבוצים',
    steps: [
      {
        num: 1, color: '#5B3E9E', bg: '#EDE9FE',
        title: 'אישור מועמדות',
        body: 'ב"בקשות הצטרפות" מגיעות כל הבקשות החדשות. אחרי אישור — המערכת מייצרת קוד גישה אוטומטי ומציגה כפתורי וואצאפ + מייל לשליחתו.',
        link: '/admin/candidate-requests', linkLabel: 'לבקשות ←',
      },
      {
        num: 2, color: '#0F766E', bg: '#CCFBF1',
        title: 'אישור מוסדות',
        body: 'ב"מוסדות" מוסדות חדשים ממתינים לאישור (רקע צהוב). לחצי "אשרי" ואחר כך שלחי הודעת אישור בוואצאפ/מייל.',
        link: '/admin/institutions', linkLabel: 'למוסדות ←',
      },
      {
        num: 3, color: '#B45309', bg: '#FDF3E3',
        title: 'ניהול קודי גישה',
        body: 'ב"קודי גישה" ניתן ליצור קודים ידנית לשימוש חוזר (לאירועים, קורסים). כל קוד ניתן לסמן בתווית ולראות מי השתמש בו.',
        link: '/admin/access-codes', linkLabel: 'לקודי גישה ←',
      },
      {
        num: 4, color: '#1565C0', bg: '#DBEAFE',
        title: 'התאמות אוטומטיות',
        body: 'דף "התאמות" מחשב אוטומטית אילו מועמדות מתאימות לאילו משרות — לפי מחוז, עיר והתמחות. ניתן לפנות ישירות בוואצאפ.',
        link: '/admin/matches', linkLabel: 'להתאמות ←',
      },
      {
        num: 5, color: '#1A7A4A', bg: '#E4F6ED',
        title: 'דוחות ושיבוצים',
        body: 'בדף "דוחות" מוצגים KPI, אחוז הצלחה, גרפים לפי מחוז והתמחות, ורשימת שיבוצים. ניתן לייצא ל-CSV/Excel.',
        link: '/admin/reports', linkLabel: 'לדוחות ←',
      },
    ],
    tips: [
      'מוסד לא מאושר לא מופיע בחיפוש ולא יכול לפרסם משרות',
      'מועמדת עם מחוז + התמחות מקבלת ציון התאמה גבוה יותר',
      'לייצוא נתונים — כפתורי CSV בדף הדוחות',
    ],
  },
}

GUIDES['אדמין מערכת'] = { ...GUIDES['מנהל רשת'], title: 'מדריך לאדמין מערכת' }

type Step = {
  num: number; color: string; bg: string
  title: string; body: string
  link: string; linkLabel: string
}

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const guide = GUIDES[profile.role] ?? GUIDES['מועמדת']
  const waNumber = process.env.NEXT_PUBLIC_WA_SUPPORT_NUMBER ?? ''
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent('שלום, יש לי שאלה לגבי מערכת הגיוס')}`
    : null

  return (
    <div className="p-4 md:p-8 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
          <HelpCircle size={22} />
        </div>
        <div>
          <h1 className="page-title">{guide.title}</h1>
          <p className="page-subtitle">{guide.subtitle}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {guide.steps.map(step => (
          <div key={step.num} className="rounded-[16px] border p-5"
            style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[15px] font-extrabold shrink-0"
                style={{ background: step.bg, color: step.color }}>
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-extrabold mb-1.5" style={{ color: 'var(--ink)' }}>
                  {step.title}
                </h2>
                <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: 'var(--ink-3)' }}>
                  {step.body}
                </p>
                <Link href={step.link}
                  className="inline-flex items-center gap-1 text-[13px] font-bold no-underline"
                  style={{ color: step.color }}>
                  {step.linkLabel}
                  <ChevronLeft size={13} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="rounded-[16px] border p-5 mb-6"
        style={{ background: '#F9F8FF', borderColor: '#DDD6FE' }}>
        <h3 className="text-[13px] font-extrabold uppercase tracking-[.08em] mb-3"
          style={{ color: 'var(--purple)' }}>
          טיפים חשובים
        </h3>
        <ul className="space-y-2">
          {guide.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--teal)' }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* WA support */}
      {waLink && (
        <a href={waLink} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 rounded-[14px] p-4 border no-underline transition-all"
          style={{ background: '#E7FBF0', borderColor: '#bbf7d0' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[20px] shrink-0"
            style={{ background: '#25D366' }}>
            💬
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: '#166534' }}>צרי קשר עם התמיכה</p>
            <p className="text-[12.5px]" style={{ color: '#15803D' }}>שלחי הודעה בוואצאפ ונחזור אליך בהקדם</p>
          </div>
        </a>
      )}
    </div>
  )
}
