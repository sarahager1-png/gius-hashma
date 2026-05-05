# אפיון מערכת: giuus — מערכת גיוס והשמה לרשת חינוך חב"ד
**תאריך:** 30 אפריל 2026 | **גרסה:** 1.2

---

## 1. מטרות ורקע

### מטרות המערכת
- **מטרה ארגונית:** לרכז את כל תהליך גיוס אנשי חינוך ברשת אהלי יוסף יצחק לובאוויטש — ממועמדת חדשה ועד שיבוץ סופי — בפלטפורמה אחת
- **מטרת המועמדת:** למצוא משרה חינוכית מתאימה ולהגיש מועמדות בקלות
- **מטרת המוסד:** לפרסם משרות, לחפש מועמדות ולנהל את תהליך הגיוס
- **מטרת מנהל הרשת:** לאשר, לנטר ולנתח את כלל פעילות הגיוס ברשת

### מדדי הצלחה
- זמן ממועמדות → שיבוץ < 14 יום
- אחוז מילוי משרות פעילות > 80%
- ציון התאמה אוטומטי > 7 בשיבוצים בפועל

---

## 2. פרסונות משתמש

### פרסונה א׳: מרים — מועמדת
- **גיל ורקע:** 24, בוגרת סמינר, מחפשת עבודה בחינוך חב"די
- **מטרה:** למצוא משרה ראשונה מתאימה (עיר, התמחות, היקף)
- **כאב:** לא יודעת לאיזה מוסד לפנות, הליך הגשה מפוזר
- **מכשיר:** סמארטפון בעיקר
- **רמת טק:** בינונית
- **ציטוט:** "אני רוצה לדעת מה קורה עם המועמדות שלי — אף אחד לא חוזר אליי"

### פרסונה ב׳: הרב לוין — מנהל מוסד
- **גיל ורקע:** 45, מנהל "שלהבות חב"ד" בחיפה
- **מטרה:** למצוא מורה ליסודי לשנה"ל הבאה, מהר
- **כאב:** מבזבז שעות על WhatsApp, אין מעקב מסודר
- **מכשיר:** מחשב נייד
- **רמת טק:** נמוכה
- **ציטוט:** "אני צריך לראות מי פנוי ומי מתאים — בלי לחפש בכל מיני מקומות"

### פרסונה ג׳: בינה — מנהלת רשת
- **גיל ורקע:** 38, אחראית גיוס ברמת הרשת
- **מטרה:** לראות תמונה מלאה: כמה משרות פתוחות, כמה שיבוצים, איפה יש פערים
- **כאב:** חסרים נתונים, מידע מפוזר ב-WhatsApp וגיליונות
- **מכשיר:** מחשב, לפעמים טלפון
- **רמת טק:** גבוהה
- **ציטוט:** "אני רוצה לאשר ולעקוב מהמסך — בלי לשלוח הודעות ידניות"

---

## 3. מפת המערכת (מלאה)

```
/ (root)
├── /                               — דף בית כללי
├── /login                          — כניסה (אימייל + גוגל)
├── /register                       — בחירת סוג הרשמה
│   ├── /register/candidate         — הרשמת מועמדת (קוד גישה)
│   │   └── /register/candidate/activate  — הפעלת קוד + הכנסת פרטים
│   ├── /register/institution       — הרשמת מוסד
│   └── /register/admin             — הרשמת מנהל (קוד סודי)
│
├── /mumedet                        — פורטל מועמדות (landing + login)
├── /mosad                          — פורטל מוסדות (landing + login)
├── /nehal                          — פורטל מנהלים (login Google + אימייל)
│
├── 🔒 (dashboard) — לכל תפקיד
│   ├── /dashboard                  — לוח בקרה (3 גרסאות לפי תפקיד)
│   ├── /jobs                       — משרות
│   │   └── /jobs/[id]              — פרטי משרה + הגשה
│   ├── /candidates                 — מאגר מועמדות (כולם)
│   │   └── /candidates/[id]        — פרופיל מועמדת
│   ├── /institutions               — מוסדות (כולם)
│   │   └── /institutions/[id]      — פרופיל מוסד
│   ├── /profile                    — פרופיל אישי
│   ├── /my-applications            — הגשות שלי (מועמדת)
│   ├── /my-invitations             — הזמנות לראיון (מועמדת)
│   ├── /messages                   — שליחת WhatsApp קבוצתי
│   ├── /history                    — היסטוריית פעילות
│   ├── /help                       — מדריך אישי לפי תפקיד + זרימה עד שיבוץ
│   ├── /settings                   — הגדרות
│   │
│   ├── 🔒 מוסד בלבד
│   │   ├── /institution/jobs           — משרות המוסד
│   │   │   ├── /institution/jobs/new   — פרסום משרה חדשה
│   │   │   └── /institution/jobs/[id]  — פרטי משרה + תיבת הגשות
│   │   │       └── /institution/jobs/[id]/edit — עריכת משרה
│   │   ├── /institution/candidates     — מאגר מועמדות של המוסד
│   │   ├── /institution/inquiries      — פניות נכנסות ממועמדות
│   │   ├── /institution/invitations    — הזמנות שנשלחו
│   │   └── /institution/profile        — פרופיל המוסד
│   │
│   └── 🔒 מנהל רשת בלבד
│       ├── /admin/candidate-requests   — אישור מועמדות + קודי גישה
│       ├── /admin/institutions         — אישור מוסדות
│       ├── /admin/candidates           — ניהול כלל המועמדות
│       ├── /admin/matches              — התאמות אוטומטיות
│       ├── /admin/access-codes         — ניהול קודי גישה
│       ├── /admin/reports              — דוחות + KPI + ייצוא CSV
│       └── /admin/admins               — ניהול מנהלי מערכת
│
└── /api
    ├── /api/profile                    — יצירה/עדכון פרופיל (POST)
    ├── /api/jobs                       — ניהול משרות (GET/POST)
    │   └── /api/jobs/[id]              — משרה בודדת (GET/PATCH/DELETE)
    ├── /api/applications               — הגשות (GET/POST)
    │   ├── /api/applications/[id]      — הגשה בודדת (PATCH)
    │   └── /api/applications/mine      — הגשות המועמדת (GET)
    ├── /api/invitations                — הזמנות לראיון (GET/POST)
    │   └── /api/invitations/[id]       — הזמנה בודדת (PATCH)
    ├── /api/interviews                 — ראיונות (GET/POST)
    │   └── /api/interviews/[id]        — ראיון בודד (PATCH)
    ├── /api/inquiries                  — פניות ממועמדות (GET/POST)
    │   └── /api/inquiries/[id]         — פנייה בודדת (PATCH)
    ├── /api/candidates                 — מאגר מועמדות (GET)
    ├── /api/institutions               — מוסדות (GET)
    │   ├── /api/institutions/[id]      — מוסד בודד (GET/PATCH)
    │   ├── /api/institutions/[id]/approve    — אישור מוסד (POST)
    │   ├── /api/institutions/attention       — מוסדות הדורשים תשומת לב (GET)
    │   └── /api/institutions/pending-count   — ספירת ממתינים (GET)
    ├── /api/notifications              — התראות (GET/PATCH)
    ├── /api/access-codes               — קודי גישה (GET/POST)
    ├── /api/candidate-requests         — בקשות הצטרפות (GET/POST)
    │   └── /api/candidate-requests/[id]     — בקשה בודדת (PATCH)
    ├── /api/activity                   — פעילות אחרונה (GET)
    ├── /api/funnel                     — נתוני משפך (GET)
    ├── /api/dashboard/kpis             — KPI לדאשבורד (GET)
    ├── /api/dashboard/trends           — גרף מגמות (GET)
    ├── /api/admin/matches              — מנוע התאמות (GET)
    ├── /api/admin/reports/export       — ייצוא CSV (GET)
    ├── /api/admin/admins               — ניהול מנהלים (GET/POST)
    │   └── /api/admin/admins/[id]      — מנהל בודד (DELETE)
    ├── /api/admin/alerts               — התראות ניהוליות (GET)
    └── /api/admin/processes            — מעקב תהליכים (GET)
```

---

## 4. זרימות מפתח עד שיבוץ

### זרימה 1: מועמדת — מהרשמה עד שיבוץ

```
הגשת בקשה    →    קבלת קוד    →    הרשמה    →    פרופיל מלא
     │               │                │               │
     │         (וואצאפ/מייל)    (קוד + אימייל)  (מחוז+התמחות)
     │                                               │
     ▼                                               ▼
טופס ציבורי                               עיון במשרות / פנייה למוסד
                                                     │
                              ┌──────────────────────┤
                              │                      │
                              ▼                      ▼
                       הגשת מועמדות           פנייה ישירה
                       (למשרה ספציפית)        (למוסד ספציפי)
                              │
                              ▼
                    ממתינה → נצפתה → הזמנה לראיון
                              │
                        אשרי / דחי
                              │ אישור
                              ▼
                            ראיון
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              התקבלת ✅            נדחית ❌
                    │
                    ▼
            ★ שיבוץ ★
            עדכון סטטוס ל"משובצת"
            בפרופיל + היסטוריה
```

### זרימה 2: מוסד — מפרסום משרה עד שיבוץ

```
הרשמת מוסד  →  אישור מנהל  →  פרסום משרה
                                    │
                    ┌───────────────┤
                    │               │
                    ▼               ▼
             קבלת הגשות       חיפוש פעיל
             (נכנסות)         (מאגר מועמדות)
                    │               │
                    └───────┬───────┘
                            │
                            ▼
                    עיון בפרופילים
                            │
                            ▼
                   הזמנה לראיון (רשמית)
                   + וואצאפ אוטומטי
                            │
                   מועמדת מאשרת
                            │
                            ▼
                          ראיון
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
           אישור הגשה            דחיית הגשה
           (התקבלה)              (נדחתה)
                  │
                  ▼
          ★ שיבוץ ★
          סגירת משרה → סטטוס "אויישה"
```

### זרימה 3: מנהל רשת — בקרה ותפעול

```
בקשת מועמדת         בקשת מוסד          מעקב שוטף
      │                   │                  │
      ▼                   ▼                  ▼
  סקירה ידנית       סקירה ידנית      התאמות אוטומטיות
      │                   │            (מחוז+התמחות)
  אשר / דחה         אשר / דחה              │
      │                   │                  ▼
  קוד גישה נוצר    מוסד מוכשר         WhatsApp לפי רשימה
  וואצאפ/מייל      לפרסם משרות             │
                                            ▼
                                   דוחות + KPI + CSV
                                   ★ שיבוצים בפועל ★
```

### זרימה 4: משפך גיוס מלא (Funnel)

```
👩 מועמדות רשומות          (סה"כ במערכת)
        │ ▼ פרופיל מלא + פעילה
✅ מועמדות פעילות           (~70%)
        │ ▼ הגישה / הוזמנה
📋 הגשות וראיונות            (~50%)
        │ ▼ נצפתה ע"י מוסד
👁  נצפו                     (~40%)
        │ ▼ הוזמנה לראיון
🎤 ראיונות                   (~25%)
        │ ▼ התקבלה
★  שיבוצים                  (~15%)
```

---

## 5. אפיון עמודים מרכזיים

### לוח בקרה — מנהל רשת (`/dashboard`)

| אזור | תוכן |
|------|-------|
| Header | שלום + תאריך עברי + שנה"ל |
| KPI × 4 | מועמדות פעילות / משרות פתוחות / שיבוצים / ממוצע ימי טיפול |
| גרף מגמות | הגשות × זמן (לפי שנה"ל) |
| פעולות מהירות | קיצורי דרך לאישורים + משרה חדשה |
| טבלת תשומת לב | מועמדות שלא טופלו > 7 ימים |
| Process Tracker | שלבי גיוס פעילים |
| Activity Feed | פעילות אחרונה ברשת |
| Funnel | ויזואליזציית משפך |
| ציטוט יומי | ציטוט חינוכי מחב"ד |

### לוח בקרה — מועמדת (`/dashboard`)

| אזור | תוכן |
|------|-------|
| ברכה + סטטוס | שם + סטטוס זמינות נוכחי |
| ציון פרופיל | Progress bar — כמה % הפרופיל מלא |
| משרות מותאמות | 3 משרות מחושבות לפי מחוז+התמחות |
| הגשות אחרונות | 5 הגשות + סטטוס |
| ראיונות קרובים | תאריך + מיקום + כפתור אישור |
| הזמנות ממתינות | הזמנות לא מאושרות |
| התראות | פעמון + רשימה |

### לוח בקרה — מוסד (`/dashboard`)

| אזור | תוכן |
|------|-------|
| Header | שם המוסד + סטטוס אישור |
| משרות פעילות | רשימה + ספירת הגשות + חדשות |
| מועמדות מתאימות | 3 מועמדות לפי matching |
| הגשות אחרונות | פעילות שבועית |

### כרטיס משרה — מועמדת (`/jobs`)

| אלמנט | תיאור |
|--------|--------|
| Header | שם משרה + מוסד |
| Pills | סוג משרה + סוג בית ספר |
| Meta | עיר + התמחות + תאריכים |
| גוף | תיאור + דרישות (3 שורות) |
| Footer | כפתור הגשה / "כבר הגשת" |

### דף הנחיות (`/help`)

| אלמנט | תיאור |
|--------|--------|
| ברכה אישית | "שלום [שם]!" על גרדיאנט סגול-טורקיז |
| מפת זרימה | רצף חזותי ממוספר עד שיבוץ (מסומן "יעד") |
| שלבים מפורטים | כרטיס לכל שלב + קישור ישיר לדף |
| טיפים | רשימת checkmarks |
| תמיכה | קישור וואצאפ לתמיכה (אם מוגדר) |

---

## 6. פיצ'רים — MoSCoW

### Must Have ✅ (קיים ופעיל)
- [x] הרשמה (מועמדת / מוסד / מנהל עם קוד סודי)
- [x] לוח בקרה × 3 תפקידים (תוכן שונה לחלוטין)
- [x] פרסום + עיון במשרות
- [x] מאגר מועמדות עם חיפוש + סינון מתקדם
- [x] מנוע התאמות אוטומטי (מחוז + התמחות + עיר)
- [x] ניהול הגשות + סטטוסים מלאים
- [x] הזמנות לראיון (שליחה + אישור + תיעוד)
- [x] פניות ישירות ממועמדת למוסד
- [x] שידור WhatsApp קבוצתי לפי פילטרים
- [x] דוחות + KPI + גרפים
- [x] אישור מוסדות + מועמדות
- [x] קודי גישה (אוטומטי + ידני)
- [x] מדריך אישי לפי תפקיד + זרימה מלאה עד שיבוץ
- [x] ניהול מנהלי מערכת (הוספה/הסרה)
- [x] אבטחת הרשמת מנהל (קוד סודי + בדיקת שרת)
- [x] פורטלי כניסה נפרדים (מועמדת / מוסד / מנהל)
- [x] ייצוא CSV מדף דוחות
- [x] ציון השלמת פרופיל (Progress bar)
- [x] ראיונות — תיאום תאריך ושעה
- [x] התראות בזמן אמת (פעמון + dropdown)

### Should Have (v2)
- [ ] Push Notifications (Service Worker + push server)
- [ ] SMS בנוסף ל-WhatsApp
- [ ] אפליקציה מקומית (React Native / PWA מלא)

### Won't Have (v1)
- תשלומים
- וידאו ראיון מובנה
- בינה מלאכותית להמלצות

---

## 7. דרישות טכניות

### Stack

| שכבה | טכנולוגיה | גרסה |
|------|-----------|-------|
| Framework | Next.js App Router | 16 |
| DB + Auth | Supabase (Postgres + RLS) | latest |
| Styling | Tailwind CSS v4 + CSS vars | v4 |
| UI Components | shadcn/ui | latest |
| Data Fetching | React Query (TanStack) | v5 |
| Charts | Recharts | v2 |
| Icons | Lucide React | latest |
| Font | Heebo (Google Fonts) | — |
| Hosting | Vercel | — |
| Language | TypeScript | 5 |

### משתני סביבה

```env
NEXT_PUBLIC_SUPABASE_URL=https://wluwiicclhzxlliugnqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://giuus.vercel.app
NEXT_PUBLIC_WA_SUPPORT_NUMBER=      # מספר וואצאפ תמיכה (אופציונלי)
ADMIN_REGISTRATION_CODE=Chabad2026! # קוד סודי להרשמת מנהל
```

### סכמת מסד הנתונים

```
profiles               candidates              institutions
──────────             ──────────              ────────────
id (FK auth)           profile_id (FK)         profile_id (FK)
role                   city                    institution_name
full_name              district                city
phone                  specialization          address
created_at             academic_level          phone
                       availability_status     institution_type
                       college                 is_approved
                       graduation_year         created_at
                       bio / cv_url
                       study_day
                       handwriting_font
                       technical_skills
                       interpersonal_skills
                       experiences
                       shlichut_location

jobs                   applications            invitations
────────               ────────────            ───────────
id                     id                      id
institution_id (FK)    job_id (FK)             institution_id (FK)
title                  candidate_id (FK)       candidate_id (FK)
city / district        status                  job_id (FK)
specialization         applied_at              status (ממתינה/אושרה/נדחתה)
job_type               cover_letter            message
job_types[]            viewed_at               scheduled_at
status                                         created_at
start_date / end_date  interviews
description            ──────────
                       application_id (FK)
access_codes           scheduled_at
────────────           location
code                   notes
label                  candidate_confirmed
used_by (FK)
used_at                candidate_inquiries     notifications
                       ───────────────────     ─────────────
candidate_requests     candidate_id (FK)       profile_id (FK)
──────────────────     institution_id (FK)     type
full_name              job_id (FK)             title / body
phone / city           message                 read
college                status                  related_id
specialization         institution_reply       created_at
access_code (used)     created_at
profile_id (FK)
```

### אבטחה ו-RLS
- **מועמדת:** רואה רק משרות פעילות + הגשות/הזמנות שלה בלבד
- **מוסד:** רואה רק משרות + הגשות + פניות של המוסד שלו
- **מנהל רשת:** Service Role — גישה מלאה לכל הטבלאות
- **הרשמת מנהל:** מוגנת בקוד סודי `ADMIN_REGISTRATION_CODE` (בדיקה בשרת)

### ביצועים
- First Load JS: < 200KB (Next.js code splitting)
- LCP target: < 2s
- RTL: `dir="rtl"` בכל ה-layout, `borderInlineStart/End` בכל הגבולות

---

## 8. כיוון עיצובי

| מאפיין | ערך |
|--------|-----|
| מילות מפתח | חמים, מקצועי, קהילתי, ממוקד-שליחות |
| סגול ראשי | `#4B2E83` |
| טורקיז פעולה | `#00A7B5` |
| רקע | `#F8F7FB` (חם, לא קר) |
| טיפוגרפיה | Heebo, כותרות 800 / −0.03em |
| כרטיסים | radius 16px, shadow רך + hover lift |
| Gradient מותג | סגול → טורקיז (135deg) |
| RTL | מלא — כל העמודים, כולל סיידבר |
| פונט | Heebo (לא Rubik) |

### עיצוב סיידבר
- רקע: `linear-gradient(160deg, #1A0B35, #2D1B5C, #3D2570)`
- פריט פעיל: `background rgba(255,255,255,.12)` + `border-inline-end: 3px solid #00A7B5`
- אייקון פעיל: `#00D4E8` + glow effect

---

## 9. פרטי גישה (פנימי)

### URL בייצור
`https://giuus.vercel.app`

### Supabase
- URL: `https://wluwiicclhzxlliugnqn.supabase.co`
- Schema: `supabase/schema.sql`

### חשבונות ראשיים
| אימייל | סיסמה | תפקיד |
|--------|--------|--------|
| bina@reshetch.org.il | Chabad2026! | מנהל רשת |
| network@giuus.il | (Supabase reset) | מנהל רשת (demo) |
| admin@giuus.il | (Supabase reset) | אדמין מערכת (demo) |

### כניסה לפי פורטל
| קהל | כתובת |
|-----|--------|
| מועמדות | `/mumedet` |
| מוסדות | `/mosad` |
| מנהלים | `/nehal` |
| כניסה כללית | `/login` |

---

## 10. Changelog

### v1.2 — 30 אפריל 2026
- ✅ אבטחת הרשמת מנהל — קוד סודי + בדיקת שרת (`ADMIN_REGISTRATION_CODE`)
- ✅ הזמנה לראיון ישירות מתוך פנייה ממועמדת (`/institution/inquiries`)
- ✅ פורטל מנהל (`/nehal`) — נוספה כניסה עם אימייל+סיסמה (בנוסף לגוגל)
- ✅ דף הנחיות מחודש — ברכה אישית + מפת זרימה מלאה עד שיבוץ לכל תפקיד
- ✅ אפיון מעודכן — מפת נתיבים מלאה + כל ה-API routes + סכמת DB

### v1.1 — 28 אפריל 2026
- ✅ ייצוא CSV מדף דוחות
- ✅ ציון השלמת פרופיל (Progress bar בדאשבורד מועמדת)
- ✅ לוח שנה לתיאום ראיונות (date picker בהזמנה)
- ✅ מסך מובייל משופר לדאשבורד

### v1.0 — 24 אפריל 2026
- השקה ראשונית
- כל תפקידי הליבה (מועמדת / מוסד / מנהל)
- מנוע התאמות, דוחות, WhatsApp broadcasting
