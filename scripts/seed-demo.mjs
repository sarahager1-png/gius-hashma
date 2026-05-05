/**
 * seed-demo.mjs — נתוני דמו: מוסדות, משרות, מועמדות
 * הרצה: node scripts/seed-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wluwiicclhzxlliugnqn.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXdpaWNjbGh6eGxsaXVnbnFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg4ODAyMiwiZXhwIjoyMDkyNDY0MDIyfQ.sR1g2O5Bq4p01UzSc27YQYGk-xNhSW3JVwBusj7XXZ0'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── יצירת/אחזור auth user ──────────────────────────────────────
async function getOrCreateUser(email, fullName) {
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users?.find(u => u.email === email)
  if (existing) return existing.id

  const { data, error } = await sb.auth.admin.createUser({
    email, password: 'Demo2025!', email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  return data.user.id
}

// ── נתוני מוסדות ─────────────────────────────────────────────────
const INSTITUTIONS = [
  { email: 'gan-orot@demo.giuus.il',    name: 'גן ילדים "אורות"',         city: 'תל אביב',       district: 'תל אביב והמרכז',    phone: '03-5551001', type: 'גן ילדים' },
  { email: 'bs-shalhevet@demo.giuus.il', name: 'בית ספר יסודי "שלהבות"',  city: 'ירושלים',       district: 'ירושלים והסביבה',   phone: '02-5552002', type: 'בית ספר יסודי' },
  { email: 'gan-nitzozot@demo.giuus.il', name: 'גן ילדים "ניצוצות"',       city: 'חיפה',          district: 'חיפה והצפון',       phone: '04-5553003', type: 'גן ילדים' },
  { email: 'bs-tiferet@demo.giuus.il',   name: 'בית ספר יסודי "תפארת"',   city: 'באר שבע',       district: 'באר שבע והנגב',     phone: '08-5554004', type: 'בית ספר יסודי' },
  { email: 'gan-kochavim@demo.giuus.il', name: 'גן ילדים "כוכבים"',        city: 'נתניה',         district: 'נתניה והשרון',      phone: '09-5555005', type: 'גן ילדים' },
  { email: 'bs-levzion@demo.giuus.il',   name: 'בית ספר "לב ציון"',        city: 'ראשון לציון',   district: 'ראשון לציון והדרום', phone: '03-5556006', type: 'בית ספר יסודי' },
]

// ── נתוני משרות ──────────────────────────────────────────────────
function jobs(instIds) {
  const [gan1, bs1, gan2, bs2, gan3, bs3] = instIds
  const today   = new Date()
  const in3m    = d => { const x = new Date(d); x.setMonth(x.getMonth() + 3); return x.toISOString().slice(0,10) }
  const in6m    = d => { const x = new Date(d); x.setMonth(x.getMonth() + 6); return x.toISOString().slice(0,10) }
  const t       = today.toISOString().slice(0,10)

  return [
    // ── גן אורות (תל אביב) ───────────────────────────────────────
    {
      institution_id: gan1, title: "סטאג'יסטית לגן ילדים",
      description: 'דרושה סטאג׳יסטית עם נסיון עם ילדים קטנים. עבודה בצוות מקצועי ותומך.',
      city: 'תל אביב', district: 'תל אביב והמרכז',
      specialization: 'אחר', job_type: "סטאג'", job_types: ["סטאג'"],
      placement_type: 'שיבוץ לשנה', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: gan1, title: 'גננת משלימה לשעות אחה"צ',
      description: 'גן מוכר, סביבת עבודה מצוינת. המשרה כוללת אחריות על קבוצת ילדים.',
      city: 'תל אביב', district: 'תל אביב והמרכז',
      specialization: 'אחר', job_type: 'חלקי', job_types: ['חלקי'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    // ── שלהבות (ירושלים) ─────────────────────────────────────────
    {
      institution_id: bs1, title: 'מורה לכיתות ב–ד',
      description: 'בית ספר יסודי חב"ד בירושלים מחפש מורה לכיתות ב–ד. נסיון יתרון.',
      city: 'ירושלים', district: 'ירושלים והסביבה',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs1, title: 'מורה לאנגלית',
      description: 'דרוש/ה מורה לאנגלית לכיתות ג–ו. תואר רלוונטי חובה.',
      city: 'ירושלים', district: 'ירושלים והסביבה',
      specialization: 'יסודי', job_type: 'חלקי', job_types: ['חלקי'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs1, title: 'מורה מחנכת כיתה א',
      description: 'הזדמנות מיוחדת למחנכת כיתה א ברוח חב"ד. תמיכה מלאה מהצוות.',
      city: 'ירושלים', district: 'ירושלים והסביבה',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ לשנה', status: 'אוישה',
      start_date: t, end_date: in6m(t),
    },
    // ── ניצוצות (חיפה) ───────────────────────────────────────────
    {
      institution_id: gan2, title: "סטאג'יסטית גן — חיפה",
      description: 'גן חב"ד בחיפה מחפש סטאג׳יסטית נלהבת. ליווי צמוד ממדריכה פדגוגית.',
      city: 'חיפה', district: 'חיפה והצפון',
      specialization: 'אחר', job_type: "סטאג'", job_types: ["סטאג'"],
      placement_type: 'שיבוץ לשנה', status: 'פעילה',
      start_date: t, end_date: in3m(t),
    },
    {
      institution_id: gan2, title: 'גננת לגן מיוחד',
      description: 'גן ילדים עם דגש על חינוך מיוחד — דרוש/ה גננת עם הכשרה בחינוך מיוחד.',
      city: 'חיפה', district: 'חיפה והצפון',
      specialization: 'אחר', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    // ── תפארת (באר שבע) ──────────────────────────────────────────
    {
      institution_id: bs2, title: 'מורה לחינוך מיוחד',
      description: 'בית ספר יסודי "תפארת" בבאר שבע מחפש מורה לחינוך מיוחד. כיתות תמיכה.',
      city: 'באר שבע', district: 'באר שבע והנגב',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs2, title: 'מורה למתמטיקה כיתות ד–ו',
      description: 'דרוש/ה מורה למתמטיקה. שיטת הוראה חדשנית וסביבת עבודה תומכת.',
      city: 'באר שבע', district: 'באר שבע והנגב',
      specialization: 'יסודי', job_type: 'חלקי', job_types: ['חלקי'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs2, title: 'עוזרת מחנכת לכיתה ב',
      description: 'תפקיד תומך — עוזרת מחנכת לכיתה ב. מתאים לשנה ראשונה בשדה.',
      city: 'באר שבע', district: 'באר שבע והנגב',
      specialization: 'יסודי', job_type: "סטאג'", job_types: ["סטאג'"],
      placement_type: 'שיבוץ לשנה', status: 'מושהית',
      start_date: t, end_date: in3m(t),
    },
    // ── כוכבים (נתניה) ───────────────────────────────────────────
    {
      institution_id: gan3, title: "סטאג'יסטית לגן — נתניה",
      description: 'גן "כוכבים" בנתניה מזמין סטאג׳יסטיות מוסמכות. אווירה חמה ומשפחתית.',
      city: 'נתניה', district: 'נתניה והשרון',
      specialization: 'אחר', job_type: "סטאג'", job_types: ["סטאג'"],
      placement_type: 'שיבוץ לשנה', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: gan3, title: 'גננת צהריים',
      description: 'תפקיד חלקי — גננת צהריים לקבוצת ילדים קטנה. שעות גמישות.',
      city: 'נתניה', district: 'נתניה והשרון',
      specialization: 'אחר', job_type: 'חלקי', job_types: ['חלקי'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    // ── לב ציון (ראשון לציון) ─────────────────────────────────────
    {
      institution_id: bs3, title: 'מורה מחנכת כיתות ב–ג',
      description: 'בית ספר "לב ציון" מחפש מורה מחנכת ברוח חב"ד. תנאים מצוינים.',
      city: 'ראשון לציון', district: 'ראשון לציון והדרום',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs3, title: 'מורה לגיל הרך — כיתה א',
      description: 'דרוש/ה מורה לכיתה א עם נסיון בגיל הרך. הנחיה פדגוגית מלאה.',
      city: 'ראשון לציון', district: 'ראשון לציון והדרום',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ לשנה', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs3, title: "סטאג'יסטית — ראשון לציון",
      description: 'הזדמנות לסטאג׳יסטית מחויבת. ליווי פדגוגי אישי לאורך כל השנה.',
      city: 'ראשון לציון', district: 'ראשון לציון והדרום',
      specialization: 'יסודי', job_type: "סטאג'", job_types: ["סטאג'"],
      placement_type: 'שיבוץ לשנה', status: 'פעילה',
      start_date: t, end_date: in3m(t),
    },
    {
      institution_id: bs3, title: 'מורה מחליפה',
      description: 'מילוי מקום מלא לחופשת לידה. מתאים למורה מנוסה או בוגרת.',
      city: 'ראשון לציון', district: 'ראשון לציון והדרום',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'מילוי מקום לחופשת לידה', status: 'פעילה',
      start_date: t, end_date: in3m(t),
    },
    // ── מוסדות שונים ─────────────────────────────────────────────
    {
      institution_id: gan1, title: 'גננת מנוסה — תל אביב',
      description: 'גן "אורות" מחפש גננת מנוסה לניהול קבוצת צהריים. נסיון חובה.',
      city: 'תל אביב', district: 'תל אביב והמרכז',
      specialization: 'אחר', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ קבוע', status: 'אוישה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs1, title: 'מורה לחינוך גופני',
      description: 'בית ספר שלהבות מחפש מורה לחינוך גופני. שיעורים בחוץ ובפנים.',
      city: 'ירושלים', district: 'ירושלים והסביבה',
      specialization: 'יסודי', job_type: 'חלקי', job_types: ['חלקי'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: bs2, title: 'יועצת חינוכית',
      description: 'תפקיד ייחודי — יועצת חינוכית לבית ספר יסודי בבאר שבע. רק בוגרות.',
      city: 'באר שבע', district: 'באר שבע והנגב',
      specialization: 'יסודי', job_type: 'מלא', job_types: ['מלא'],
      placement_type: 'שיבוץ קבוע', status: 'פעילה',
      start_date: t, end_date: in6m(t),
    },
    {
      institution_id: gan2, title: 'עוזרת גננת',
      description: 'גן "ניצוצות" מחפש עוזרת גננת לבוקר. עבודה עם ילדים גיל 3–6.',
      city: 'חיפה', district: 'חיפה והצפון',
      specialization: 'אחר', job_type: 'חלקי', job_types: ['חלקי'],
      placement_type: 'שיבוץ לשנה', status: 'פעילה',
      start_date: t, end_date: in3m(t),
    },
  ]
}

// ── נתוני מועמדות ─────────────────────────────────────────────────
const CANDIDATES_DATA = [
  { email: 'sara.cohen@demo.giuus.il',     full: 'שרה כהן',       city: 'תל אביב',     spec: 'גן ילדים',       level: "שנה ג' - סטאג'",  avail: "מחפשת סטאג'",         grad: 2025, birth: 1999, married: 'רווקה',  phone: '050-1111001' },
  { email: 'rivka.levi@demo.giuus.il',     full: 'רבקה לוי',      city: 'ירושלים',     spec: 'יסודי',          level: 'תואר ראשון',       avail: 'בוגרת מחפשת משרה',    grad: 2023, birth: 1997, married: 'נשואה',  phone: '050-1111002' },
  { email: 'malka.green@demo.giuus.il',    full: 'מלכה גרין',     city: 'חיפה',        spec: 'גן ילדים',       level: "שנה ב' - סטאג'",   avail: "מחפשת סטאג'",         grad: 2026, birth: 2001, married: 'רווקה',  phone: '050-1111003' },
  { email: 'devorah.katz@demo.giuus.il',   full: 'דבורה כץ',      city: 'בני ברק',     spec: 'יסודי',          level: 'תואר ראשון',       avail: 'פתוחה להצעות',        grad: 2022, birth: 1996, married: 'נשואה',  phone: '050-1111004' },
  { email: 'chana.rosen@demo.giuus.il',    full: "חנה רוז'ן",     city: 'ראשון לציון', spec: 'גן ילדים',       level: "שנה ג' - סטאג'",  avail: "מחפשת סטאג'",         grad: 2025, birth: 2000, married: 'רווקה',  phone: '050-1111005' },
  { email: 'leah.mizrahi@demo.giuus.il',   full: 'לאה מזרחי',     city: 'נתניה',       spec: 'יסודי',          level: 'תואר שני',         avail: 'פתוחה להצעות',        grad: 2021, birth: 1995, married: 'נשואה',  phone: '050-1111006' },
  { email: 'rochel.fried@demo.giuus.il',   full: 'רחל פריד',      city: 'באר שבע',     spec: 'גן ילדים',       level: "שנה ב' - סטאג'",   avail: "מחפשת סטאג'",         grad: 2026, birth: 2001, married: 'רווקה',  phone: '050-1111007' },
  { email: 'tova.shapiro@demo.giuus.il',   full: 'טובה שפירא',    city: 'ירושלים',     spec: 'יסודי',          level: 'תואר ראשון',       avail: 'בוגרת מחפשת משרה',    grad: 2024, birth: 1998, married: 'נשואה',  phone: '050-1111008' },
  { email: 'miriam.gold@demo.giuus.il',    full: 'מרים גולד',     city: 'תל אביב',     spec: 'גן ילדים',       level: 'תואר ראשון',       avail: 'משובצת',              grad: 2022, birth: 1997, married: 'נשואה',  phone: '050-1111009' },
  { email: 'bluma.silver@demo.giuus.il',   full: 'בלומה סילבר',   city: 'חיפה',        spec: 'יסודי',          level: "שנה ג' - סטאג'",  avail: "מחפשת סטאג'",         grad: 2025, birth: 1999, married: 'רווקה',  phone: '050-1111010' },
  { email: 'gittel.perl@demo.giuus.il',    full: 'גיטל פרל',      city: 'נתניה',       spec: 'גן ילדים',       level: "שנה ב' - סטאג'",   avail: "מחפשת סטאג'",         grad: 2026, birth: 2001, married: 'רווקה',  phone: '050-1111011' },
  { email: 'fayge.weiss@demo.giuus.il',    full: 'פייגה וייס',    city: 'ראשון לציון', spec: 'יסודי',          level: 'תואר ראשון',       avail: 'בוגרת מחפשת משרה',    grad: 2023, birth: 1997, married: 'נשואה',  phone: '050-1111012' },
  { email: 'dina.klein@demo.giuus.il',     full: 'דינה קליין',    city: 'באר שבע',     spec: 'גן ילדים',       level: 'תואר ראשון',       avail: 'פתוחה להצעות',        grad: 2022, birth: 1996, married: 'נשואה',  phone: '050-1111013' },
  { email: 'menucha.stern@demo.giuus.il',  full: 'מנוחה שטרן',    city: 'בני ברק',     spec: 'יסודי',          level: "שנה ג' - סטאג'",  avail: "מחפשת סטאג'",         grad: 2025, birth: 1999, married: 'רווקה',  phone: '050-1111014' },
  { email: 'hadasa.bron@demo.giuus.il',    full: 'הדסה ברון',     city: 'תל אביב',     spec: 'גן ילדים',       level: 'תואר שני',         avail: 'פתוחה להצעות',        grad: 2020, birth: 1993, married: 'נשואה',  phone: '050-1111015' },
  { email: 'tzipa.lerner@demo.giuus.il',   full: 'ציפה לרנר',     city: 'ירושלים',     spec: 'יסודי',          level: "שנה ב' - סטאג'",   avail: "מחפשת סטאג'",         grad: 2026, birth: 2001, married: 'רווקה',  phone: '050-1111016' },
  { email: 'sori.groen@demo.giuus.il',     full: 'שרי גרין',      city: 'חיפה',        spec: 'גן ילדים',       level: 'תואר ראשון',       avail: 'בוגרת מחפשת משרה',    grad: 2023, birth: 1997, married: 'נשואה',  phone: '050-1111017' },
  { email: 'yehudis.blum@demo.giuus.il',   full: 'יהודית בלום',   city: 'נתניה',       spec: 'יסודי',          level: 'תואר ראשון',       avail: 'פתוחה להצעות',        grad: 2024, birth: 1998, married: 'נשואה',  phone: '050-1111018' },
  { email: 'esther.rubin@demo.giuus.il',   full: 'אסתר רובין',    city: 'באר שבע',     spec: 'גן ילדים',       level: "שנה ג' - סטאג'",  avail: "מחפשת סטאג'",         grad: 2025, birth: 2000, married: 'רווקה',  phone: '050-1111019' },
  { email: 'pnina.jacobs@demo.giuus.il',   full: 'פנינה יעקובס',  city: 'ראשון לציון', spec: 'יסודי',          level: 'תואר שני',         avail: 'פתוחה להצעות',        grad: 2021, birth: 1994, married: 'נשואה',  phone: '050-1111020' },
]

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 מתחיל הכנסת נתוני דמו...\n')

  // ── 1. מוסדות ───────────────────────────────────────────────────
  console.log('🏫 יוצר מוסדות...')
  const instIds = []
  for (const inst of INSTITUTIONS) {
    const userId = await getOrCreateUser(inst.email, inst.name)

    // profile
    await sb.from('profiles').upsert(
      { id: userId, role: 'מוסד', full_name: inst.name, phone: inst.phone },
      { onConflict: 'id' }
    )

    // institution
    const { data: existInst } = await sb
      .from('institutions').select('id').eq('profile_id', userId).maybeSingle()

    let instId = existInst?.id
    if (!instId) {
      const { data: newInst, error } = await sb.from('institutions').insert({
        profile_id:       userId,
        institution_name: inst.name,
        city:             inst.city,
        district:         inst.district,
        phone:            inst.phone,
        is_approved:      true,
        approved_at:      new Date().toISOString(),
      }).select('id').single()
      if (error) throw new Error(`institution ${inst.name}: ${error.message}`)
      instId = newInst.id
    }

    instIds.push(instId)
    console.log(`   ✓ ${inst.name} (${inst.city})`)
  }

  // ── 2. משרות ────────────────────────────────────────────────────
  console.log('\n💼 יוצר משרות...')
  const jobList = jobs(instIds)
  for (const job of jobList) {
    const { data: exists } = await sb
      .from('jobs').select('id')
      .eq('institution_id', job.institution_id).eq('title', job.title).maybeSingle()

    if (!exists) {
      const { error } = await sb.from('jobs').insert(job)
      if (error) throw new Error(`job ${job.title}: ${error.message}`)
    }
    console.log(`   ✓ ${job.title} — ${job.city} [${job.status}]`)
  }

  // ── 3. מועמדות ──────────────────────────────────────────────────
  console.log('\n👩‍🎓 יוצרת מועמדות...')
  for (const c of CANDIDATES_DATA) {
    const userId = await getOrCreateUser(c.email, c.full)

    await sb.from('profiles').upsert(
      { id: userId, role: 'מועמדת', full_name: c.full, phone: c.phone },
      { onConflict: 'id' }
    )

    const { data: existCand } = await sb
      .from('candidates').select('id').eq('profile_id', userId).maybeSingle()

    if (!existCand) {
      const { error } = await sb.from('candidates').insert({
        profile_id:          userId,
        city:                c.city,
        graduation_year:     c.grad,
        birth_year:          c.birth,
        marital_status:      c.married,
        availability_status: c.avail,
        academic_level:      c.level,
        years_experience:    c.grad <= 2023 ? new Date().getFullYear() - c.grad : 0,
        has_cv:              false,
      })
      if (error) throw new Error(`candidate ${c.full}: ${error.message}`)
    }
    console.log(`   ✓ ${c.full} — ${c.city} (${c.avail})`)
  }

  console.log('\n✅ נתוני דמו הוכנסו בהצלחה!\n')
  console.log('─'.repeat(50))
  console.log(`   📊 מוסדות:  ${INSTITUTIONS.length}`)
  console.log(`   💼 משרות:   ${jobList.length}`)
  console.log(`   👩‍🎓 מועמדות: ${CANDIDATES_DATA.length}`)
  console.log('─'.repeat(50))
}

main().catch(err => {
  console.error('❌ שגיאה:', err.message)
  process.exit(1)
})
