import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { HelpCircle, CheckCircle2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

/* ─── Flow types ─── */
type FlowStage = {
  label: string
  note?: string
  highlight?: boolean  // marks the final "שיבוץ" stage
}

type Step = {
  num: number; color: string; bg: string
  title: string; body: string
  link: string; linkLabel: string
}

type Guide = {
  title: string
  subtitle: string
  flowTitle: string
  flow: FlowStage[]
  steps: Step[]
  tips: string[]
}

/* ─── Guide data ─── */
const GUIDES: Record<string, Guide> = {
  'מועמדת': {
    title: 'מדריך למועמדת',
    subtitle: 'כל מה שצריך לדעת כדי למצוא שיבוץ',
    flowTitle: 'הזרימה המלאה — מרישום עד שיבוץ',
    flow: [
      { label: 'כניסה עם Google ומילוי טופס הצטרפות', note: 'giuus.vercel.app ← מועמדת ← הגשת מועמדות' },
      { label: 'ממתינה לאישור מנהלת המערכת', note: 'תוך 24 שעות — SMS עם אישור' },
      { label: 'כניסה למערכת עם Google', note: 'לאחר האישור — כניסה ישירה לדשבורד' },
      { label: 'השלמת פרופיל', note: 'מחוז, התמחות, זמינות' },
      { label: 'הגשת מועמדות / פנייה', note: 'למשרה ספציפית או ישירות למוסד' },
      { label: 'קבלת הזמנה לראיון', note: 'מוסד שולח → את מאשרת' },
      { label: 'ראיון', note: 'פנים אל פנים / זום' },
      { label: 'שיבוץ', note: 'עדכון סטטוס ל"משובצת"', highlight: true },
    ],
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
        body: 'כנסי ל"משרות" וסנני לפי עיר, מחוז או התמחות. כשמצאת משרה מתאימה — לחצי "הגישי מועמדות" וצרפי מכתב כוונות אם רוצה. כאשר נפתחת משרה חדשה שמתאימה לפרופיל שלך, תקבלי email ו-SMS אוטומטי.',
        link: '/jobs', linkLabel: 'למשרות פעילות ←',
      },
      {
        num: 3, color: '#B45309', bg: '#FDF3E3',
        title: 'מעקב הגשות',
        body: 'ב"הגשות שלי" תוכלי לראות את סטטוס כל הגשה: ממתינה / נצפתה / התקבלה / נדחתה. כשמוסד מגיב תקבלי התראה בפעמון.',
        link: '/my-applications', linkLabel: 'להגשות שלי ←',
      },
      {
        num: 4, color: '#1565C0', bg: '#DBEAFE',
        title: 'הזמנות לראיון',
        body: 'מוסד יכול להזמין אותך לראיון ישירות — גם ללא הגשה מצדך. תקבלי התראה, ובדף "הזמנות לראיון" תוכלי לאשר או לדחות. אישרת? הראיון יירשם ביומן וגם אצל המוסד. שימי לב: הזמנה שלא הוגב עליה תוך 3 ימים — תישלח תזכורת אוטומטית. לאחר 7 ימים ללא תגובה ההזמנה תפוג אוטומטית.',
        link: '/my-invitations', linkLabel: 'להזמנות ←',
      },
      {
        num: 5, color: '#1A7A4A', bg: '#E4F6ED',
        title: 'אחרי הראיון — שיבוץ',
        body: 'התקבלת? המוסד יעדכן את סטטוס ההגשה ל"התקבלה". חשוב שתעדכני גם את הפרופיל שלך: שני סטטוס הזמינות ל"משובצת" כדי להימחק מחיפושים חדשים.',
        link: '/profile', linkLabel: 'לעדכון סטטוס ←',
      },
      {
        num: 6, color: '#7C3AED', bg: '#EDE9FE',
        title: 'פנייה ישירה למוסד',
        body: 'לא מצאת משרה מתאימה? כנסי ל"מוסדות", בחרי מוסד — ותמצאי כפתורי וואצאפ לפנייה ישירה. המוסד יכול להזמין אותך לראיון ישירות מתוך הפנייה.',
        link: '/institutions', linkLabel: 'למוסדות ←',
      },
    ],
    tips: [
      'פרופיל מלא = סיכוי גבוה יותר להתאמה אוטומטית',
      'כשנפתחת משרה חדשה שמתאימה לפרופיל שלך — תקבלי email ו-SMS אוטומטי',
      'הזמנה לראיון שלא הוגב עליה תוך 3 ימים תזכה בתזכורת, ותפוג לאחר 7 ימים',
      'עדכני סטטוס זמינות כשמתאימה לך עבודה',
      'ניתן להגיש לאותה משרה פעם אחת בלבד',
      'אחרי שיבוץ — עדכני ל"משובצת" כדי לא לקבל פניות נוספות',
    ],
  },

  'מוסד': {
    title: 'מדריך למוסד חינוך',
    subtitle: 'כיצד לפרסם משרות ולמצוא מועמדות',
    flowTitle: 'הזרימה המלאה — מפרסום משרה עד שיבוץ',
    flow: [
      { label: 'הרשמת המוסד — Google או אימייל', note: 'giuus.vercel.app ← מוסד ← הרשמת מוסד חדש' },
      { label: 'ממתינים לאישור מנהלת המערכת', note: 'תוך 24 שעות' },
      { label: 'פרסום משרה', note: 'כותרת, מחוז, התמחות' },
      { label: 'התאמות אוטומטיות', note: 'המערכת מציגה מועמדות מתאימות' },
      { label: 'קבלת הגשות / פניות', note: 'מועמדות מגישות או פונות' },
      { label: 'הזמנה לראיון', note: 'המוסד שולח הזמנה רשמית' },
      { label: 'ראיון', note: 'המועמדת מאשרת' },
      { label: 'שיבוץ', note: 'אישור הגשה + סגירת משרה', highlight: true },
    ],
    steps: [
      {
        num: 1, color: '#5B3E9E', bg: '#EDE9FE',
        title: 'פרסום משרה',
        body: 'לחצי על "משרות" ואז "משרה חדשה". מלאי כותרת, עיר, מחוז, סוג משרה ותיאור. ככל שהפרטים מלאים יותר — כך יגיעו מועמדות מתאימות יותר. עם פרסום המשרה, המערכת שולחת אוטומטית email ו-SMS לכל המועמדות שמתאימות להתמחות המשרה.',
        link: '/institution/jobs', linkLabel: 'למשרות שלי ←',
      },
      {
        num: 2, color: '#7C3AED', bg: '#EDE9FE',
        title: 'התאמות אוטומטיות',
        body: 'דף "התאמות" מחשב מועמדות המתאימות למשרות שלכם — לפי מחוז, התמחות ועיר. כל מועמדת מקבלת ציון התאמה. מכאן ניתן לשלוח הזמנה לראיון ישירות.',
        link: '/institution/matches', linkLabel: 'להתאמות ←',
      },
      {
        num: 3, color: '#0F766E', bg: '#CCFBF1',
        title: 'חיפוש חופשי במועמדות',
        body: 'ב"מועמדות" תמצאי את כל המועמדות הזמינות. ניתן לסנן לפי סטטוס, לחפש לפי שם/עיר, ולהוסיף למועדפות. מכאן גם ניתן לשלוח הזמנה לראיון.',
        link: '/institution/candidates', linkLabel: 'למועמדות ←',
      },
      {
        num: 4, color: '#B45309', bg: '#FDF3E3',
        title: 'פניות ממועמדות',
        body: 'מועמדות יכולות לפנות אליכם ישירות. ב"פניות" תוכלי לקרוא, להשיב, ולהזמין לראיון — הכל ממקום אחד.',
        link: '/institution/inquiries', linkLabel: 'לפניות ←',
      },
      {
        num: 5, color: '#1565C0', bg: '#DBEAFE',
        title: 'אחרי הראיון — אישור / דחייה',
        body: 'ב"היסטוריה" תראי את כל ההגשות. לחצי על הגשה ושני את הסטטוס: "התקבלה" לאחר קבלה, "נדחתה" לאחר דחייה. המועמדת מקבלת התראה אוטומטית.',
        link: '/history', linkLabel: 'להיסטוריה ←',
      },
      {
        num: 6, color: '#1A7A4A', bg: '#E4F6ED',
        title: 'סגירת משרה — שיבוץ',
        body: 'לאחר שיבוץ — כנסי למשרה ושני את הסטטוס ל"אויישה". המשרה תוסר מרשימת המשרות הפעילות ותישמר בהיסטוריה.',
        link: '/institution/jobs', linkLabel: 'למשרות שלי ←',
      },
    ],
    tips: [
      'עם פרסום משרה חדשה, המערכת שולחת email + SMS אוטומטי למועמדות מתאימות',
      'משרה עם מחוז מוגדר תופיע בהתאמות האוטומטיות של המערכת',
      'דף "התאמות" מציג רק מועמדות שעדיין לא הוזמנו/הגישו למשרה זו',
      'הזמנה לראיון שומרת תיעוד במערכת לשני הצדדים — ניתן להזמין גם ישירות מפנייה',
      'הזמנה שלא נענתה תוך 7 ימים פוגת אוטומטית',
      'אחרי שיבוץ — חשוב לסגור את המשרה כדי לא לקבל הגשות נוספות',
    ],
  },

  'מנהלת מערכת': {
    title: 'מדריך למנהל מערכת',
    subtitle: 'ניהול מלא של מועמדות, מוסדות ושיבוצים',
    flowTitle: 'הזרימה המלאה — מבקשה עד שיבוץ',
    flow: [
      { label: 'בקשת מועמדת מגיעה', note: 'טופס ציבורי' },
      { label: 'אישור + שליחת קוד', note: 'וואצאפ / מייל' },
      { label: 'אישור מוסד חדש', note: 'בקשת הרשמה למוסד' },
      { label: 'מוסד מפרסם משרה', note: 'אוטומטי לאחר אישור' },
      { label: 'מעקב התאמות', note: 'מנהל יכול להציע למוסד' },
      { label: 'ראיון + החלטה', note: 'מוסד ↔ מועמדת' },
      { label: 'שיבוץ', note: 'נרשם בדוחות', highlight: true },
    ],
    steps: [
      {
        num: 1, color: '#5B3E9E', bg: '#EDE9FE',
        title: 'אישור מועמדות',
        body: 'ב"בקשות הצטרפות" מגיעות כל הבקשות החדשות. לחצי "אשרי" — הפרופיל נוצר אוטומטית והמועמדת מקבלת SMS עם אישור. מאותו רגע היא יכולה להיכנס למערכת עם Google.',
        link: '/admin/candidate-requests', linkLabel: 'לבקשות ←',
      },
      {
        num: 2, color: '#0F766E', bg: '#CCFBF1',
        title: 'אישור מוסדות',
        body: 'ב"מוסדות" מוסדות חדשים ממתינים לאישור (מסומנים). לחצי "אשרי" — מהרגע זה המוסד יכול לפרסם משרות ולחפש מועמדות.',
        link: '/admin/institutions', linkLabel: 'למוסדות ←',
      },
      {
        num: 3, color: '#B45309', bg: '#FDF3E3',
        title: 'מעקב התאמות',
        body: 'דף "התאמות" מחשב אוטומטית אילו מועמדות מתאימות לאילו משרות — לפי מחוז, עיר והתמחות. ניתן להציע התאמה למוסד — המוסד מקבל התראה ויחליט אם לשלוח הזמנה למועמדת.',
        link: '/admin/matches', linkLabel: 'להתאמות ←',
      },
      {
        num: 4, color: '#1565C0', bg: '#DBEAFE',
        title: 'הודעות קבוצתיות',
        body: 'ב"הודעות" ניתן לשלוח הודעת וואצאפ לקבוצת מועמדות בבת אחת — לפי סטטוס, מחוז, התמחות או בחירה ידנית.',
        link: '/messages', linkLabel: 'להודעות ←',
      },
      {
        num: 5, color: '#1A7A4A', bg: '#E4F6ED',
        title: 'דוחות ושיבוצים',
        body: 'בדף "דוחות" מוצגים KPI, אחוז הצלחה, גרפים לפי מחוז והתמחות, וכל השיבוצים. ניתן לייצא ל-CSV/Excel לדיווח חיצוני.',
        link: '/admin/reports', linkLabel: 'לדוחות ←',
      },
      {
        num: 6, color: '#B45309', bg: '#FDF3E3',
        title: 'ניהול קודי גישה',
        body: 'ב"קודי גישה" ניתן ליצור קודים ידנית לשימוש חוזר (לאירועים, קורסים). כל קוד ניתן לסמן בתווית ולראות מי השתמש בו.',
        link: '/admin/access-codes', linkLabel: 'לקודי גישה ←',
      },
      {
        num: 7, color: '#7C3AED', bg: '#EDE9FE',
        title: 'ניהול מנהלים',
        body: 'ב"מנהלי מערכת" ניתן להוסיף מנהלים נוספים, לראות את כל בעלי הגישה הניהולית ולהסיר גישה לפי הצורך.',
        link: '/admin/admins', linkLabel: 'לניהול מנהלים ←',
      },
      {
        num: 8, color: '#D97706', bg: '#FEF3C7',
        title: 'אוטומציות המערכת',
        body: 'המערכת פועלת גם בלי התערבות: כל שני — מייל סיכום שבועי עם נתוני פעילות. כל יום — התראה על הגשות שממתינות לטיפול מוסד מעל 3 ימים. הזמנות לראיון שלא נענו תוך 7 ימים פוגות אוטומטית. בעת פתיחת משרה חדשה — מועמדות מתאימות מקבלות email + SMS אוטומטי.',
        link: '/admin/reports', linkLabel: 'לדוחות ←',
      },
    ],
    tips: [
      'מוסד לא מאושר לא מופיע בחיפוש ולא יכול לפרסם משרות',
      'מועמדת עם מחוז + התמחות מקבלת ציון התאמה גבוה יותר',
      'כל שני בבוקר — מייל סיכום שבועי לכל מנהלי המערכת',
      'כל יום — התראה אוטומטית על הגשות שממתינות לטיפול 3+ ימים',
      'לייצוא נתונים — כפתורי CSV בדף הדוחות',
      'ניתן לשלוח הודעת וואצאפ קבוצתית ל-100+ מועמדות בלחיצה',
    ],
  },
}

GUIDES['אדמין מערכת'] = { ...GUIDES['מנהלת מערכת'], title: 'מדריך לאדמין מערכת' }

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const guide = GUIDES[profile.role] ?? GUIDES['מועמדת']
  const firstName = profile.full_name?.split(' ')[0] ?? ''

  const { data: waRow } = await service
    .from('system_settings')
    .select('value')
    .eq('key', 'support_wa_number')
    .single()
  const { data: emailRow } = await service
    .from('system_settings')
    .select('value')
    .eq('key', 'contact_email')
    .single()

  const waNumber = waRow?.value || process.env.NEXT_PUBLIC_WA_SUPPORT_NUMBER || ''
  const contactEmail = emailRow?.value || ''
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent('שלום, יש לי שאלה לגבי מערכת הגיוס')}`
    : null

  return (
    <div className="p-4 md:p-8 max-w-2xl">

      {/* Header — personal greeting */}
      <div className="rounded-[18px] p-5 mb-7"
        style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', boxShadow: '0 4px 20px rgba(91,62,158,.25)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,.18)' }}>
            <HelpCircle size={22} color="white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,.75)' }}>
              המדריך האישי שלך
            </p>
            <h1 className="text-[22px] font-black leading-tight" style={{ color: '#fff', letterSpacing: '-.02em' }}>
              {firstName ? `שלום ${firstName}!` : 'שלום!'}
            </h1>
          </div>
        </div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,.85)' }}>
          {guide.subtitle} — כאן תמצאי את כל מה שצריך לדעת, צעד אחר צעד.
        </p>
      </div>

      {/* ── Flow diagram ── */}
      <div className="rounded-[18px] border p-5 mb-7"
        style={{ background: 'linear-gradient(135deg, #F9F8FF 0%, #F0FDFB 100%)', borderColor: 'var(--purple-100)' }}>
        <p className="text-[11.5px] font-extrabold uppercase tracking-[.1em] mb-4"
          style={{ color: 'var(--purple)' }}>
          {guide.flowTitle}
        </p>
        <div className="flex flex-col gap-0">
          {guide.flow.map((stage, i) => (
            <div key={i}>
              <div className="flex items-start gap-3">
                {/* Circle + line */}
                <div className="flex flex-col items-center shrink-0" style={{ width: '28px' }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                    style={stage.highlight
                      ? { background: 'linear-gradient(135deg, var(--purple), var(--teal))', color: '#fff', boxShadow: '0 2px 8px rgba(91,62,158,.35)' }
                      : { background: 'var(--purple-050)', color: 'var(--purple)' }
                    }>
                    {i + 1}
                  </div>
                  {i < guide.flow.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: 'var(--purple-100)', minHeight: '20px' }} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[13.5px] font-extrabold"
                      style={{ color: stage.highlight ? 'var(--purple)' : 'var(--ink)' }}>
                      {stage.label}
                    </span>
                    {stage.highlight && (
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, var(--purple), var(--teal))', color: '#fff' }}>
                        יעד
                      </span>
                    )}
                  </div>
                  {stage.note && (
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{stage.note}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Steps detail ── */}
      <p className="text-[11.5px] font-extrabold uppercase tracking-[.1em] mb-3 px-1"
        style={{ color: 'var(--ink-4)' }}>
        הסבר מפורט לכל שלב
      </p>
      <div className="space-y-3 mb-7">
        {guide.steps.map(step => (
          <div key={step.num} className="rounded-[14px] border p-4"
            style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[13px] font-extrabold shrink-0"
                style={{ background: step.bg, color: step.color }}>
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[14.5px] font-extrabold mb-1" style={{ color: 'var(--ink)' }}>
                  {step.title}
                </h2>
                <p className="text-[13px] leading-relaxed mb-2.5" style={{ color: 'var(--ink-3)' }}>
                  {step.body}
                </p>
                <Link href={step.link}
                  className="inline-flex items-center gap-1 text-[12.5px] font-bold no-underline"
                  style={{ color: step.color }}>
                  {step.linkLabel}
                  <ChevronLeft size={12} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="rounded-[16px] border p-5 mb-6"
        style={{ background: '#F9F8FF', borderColor: '#DDD6FE' }}>
        <h3 className="text-[11.5px] font-extrabold uppercase tracking-[.1em] mb-3"
          style={{ color: 'var(--purple)' }}>
          טיפים חשובים
        </h3>
        <ul className="space-y-2">
          {guide.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--ink-2)' }}>
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--teal)' }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Support contact */}
      {(waLink || contactEmail) && (
        <div className="space-y-3">
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 rounded-[14px] p-4 border no-underline transition-all"
              style={{ background: '#E7FBF0', borderColor: '#bbf7d0' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[20px] shrink-0"
                style={{ background: '#25D366' }}>
                💬
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: '#166534' }}>צרי קשר בוואצאפ</p>
                <p className="text-[12.5px]" style={{ color: '#15803D' }}>שלחי הודעה ונחזור אליך בהקדם</p>
              </div>
            </a>
          )}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 rounded-[14px] p-4 border no-underline transition-all"
              style={{ background: 'var(--purple-050)', borderColor: 'var(--purple-100)' }}>
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--purple)', color: '#fff', fontSize: '18px' }}>
                ✉️
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--purple)' }}>שלחי מייל</p>
                <p className="text-[12.5px] font-medium" style={{ color: 'var(--ink-3)' }} dir="ltr">{contactEmail}</p>
              </div>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
