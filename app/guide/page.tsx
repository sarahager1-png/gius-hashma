'use client'
import Image from 'next/image'

const PURPLE  = '#4B2E83'
const PURPLE2 = '#5B3AAB'
const CYAN    = '#00D4E8'
const GOLD    = '#F8D877'
const BG      = '#F2F0F8'

// ── Tiny helpers ────────────────────────────────────────────────────────────

function Badge({ text, color = PURPLE }: { text: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const,
      background: color + '18', color, border: `1px solid ${color}30`,
    }}>{text}</span>
  )
}

function Step({ n, title, sub, color = PURPLE }: { n: number; title: string; sub: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '14px', flexShrink: 0, marginTop: 2,
      }}>{n}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1F1F2E', lineHeight: 1.4 }}>{title}</div>
        <div style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  )
}

function AutoCard({ emoji, title, detail }: { emoji: string; title: string; detail: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    }}>
      <div style={{ fontSize: '24px', marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1F1F2E', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>{detail}</div>
    </div>
  )
}

function RoleSection({
  color, emoji, role, tagline, steps, features,
}: {
  color: string; emoji: string; role: string; tagline: string
  steps: { title: string; sub: string }[]
  features: { icon: string; label: string }[]
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden',
      border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,.07)',
    }}>
      {/* header */}
      <div style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        padding: '28px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>{emoji}</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '22px', lineHeight: 1.2 }}>{role}</div>
            <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px', marginTop: 2 }}>{tagline}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* flow steps */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: color, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            זרימת עבודה
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((s, i) => <Step key={i} n={i + 1} title={s.title} sub={s.sub} color={color} />)}
          </div>
        </div>

        {/* features */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: color, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            יכולות עיקריות
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: color + '08', border: `1px solid ${color}20`,
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div dir="rtl" style={{ fontFamily: 'Heebo, system-ui, sans-serif', background: BG, minHeight: '100vh' }}>

      {/* ══ HERO ══ */}
      <div style={{
        background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE2} 60%, #2a1a5e 100%)`,
        padding: '56px 24px 64px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        {/* glow */}
        <div style={{
          position: 'absolute', top: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', background: `radial-gradient(circle, ${CYAN}30 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN }} />
            <span style={{ color: 'rgba(255,255,255,.8)', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em' }}>
              מדריך מלא · מערכת גיוס והשמה
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: 'rgba(255,255,255,.14)', border: '2px solid rgba(255,255,255,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,.3)',
            }}>
              <Image src="/logo-chabad.png" alt="רשת אהלי יוסף יצחק" width={60} height={60}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: .92 }} />
            </div>
          </div>

          <h1 style={{
            color: '#fff', fontWeight: 900, fontSize: '38px',
            letterSpacing: '-.04em', lineHeight: 1.1, margin: '0 0 14px',
          }}>
            מערכת גיוס והשמה<br />
            <span style={{ color: GOLD }}>רשת אהלי יוסף יצחק</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '16px', lineHeight: 1.6, margin: '0 0 32px', maxWidth: 520, marginInline: 'auto' }}>
            פלטפורמה דיגיטלית מלאה לניהול גיוס שליחות חינוך — ממועמדת ועד קבלה, הכל במקום אחד.
          </p>

          {/* stat pills */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { n: '3', label: 'סוגי משתמשים' },
              { n: '8', label: 'אוטומציות פעילות' },
              { n: '5', label: 'ערוצי תקשורת' },
              { n: '∞', label: 'תהליכים במקביל' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 12, padding: '12px 20px', textAlign: 'center',
              }}>
                <div style={{ color: GOLD, fontWeight: 900, fontSize: '22px', lineHeight: 1 }}>{s.n}</div>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '11px', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ NAV PILLS ══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {[
            { label: '👩‍🎓 מועמדת', href: '#candidate' },
            { label: '🏫 מוסד',   href: '#institution' },
            { label: '🛠 הנהלה',  href: '#admin' },
            { label: '⚡ אוטומציות', href: '#automations' },
            { label: '📧 תקשורת',  href: '#comms' },
          ].map(p => (
            <a key={p.href} href={p.href} style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              fontSize: '13px', fontWeight: 700, color: '#6B7280',
              textDecoration: 'none', whiteSpace: 'nowrap',
              borderBottom: '2px solid transparent',
            }}
              onMouseOver={e => { e.currentTarget.style.color = PURPLE; e.currentTarget.style.borderBottomColor = PURPLE }}
              onMouseOut={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderBottomColor = 'transparent' }}
            >{p.label}</a>
          ))}
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px', display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ── Quick overview ── */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Badge text="סקירה כללית" />
            <h2 style={{ color: '#1F1F2E', fontWeight: 800, fontSize: '26px', margin: '10px 0 8px' }}>
              איך המערכת עובדת?
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: 1.6 }}>
              שלוש קבוצות משתמשים, זרימה אחת חלקה מתחילת גיוס ועד השמה.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { emoji: '👩‍🎓', label: 'מועמדת', desc: 'נרשמת עם קוד גישה, מגישה מועמדות, עוקבת אחר ראיונות', color: PURPLE },
              { emoji: '🏫', label: 'מוסד',   desc: 'מפרסם משרות, בוחן מועמדות, מנהל ראיונות', color: '#1976D2' },
              { emoji: '🛠', label: 'הנהלה',  desc: 'מנהלת את כל המערכת, מאשרת מוסדות, עוקבת אחר KPIs', color: '#2E7D32' },
            ].map(r => (
              <div key={r.label} style={{
                background: '#fff', borderRadius: 16, padding: '24px 20px', textAlign: 'center',
                border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{r.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: r.color, marginBottom: 8 }}>{r.label}</div>
                <div style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Candidate ── */}
        <div id="candidate">
          <div style={{ marginBottom: 20 }}>
            <Badge text="מועמדת" color={PURPLE} />
            <h2 style={{ color: '#1F1F2E', fontWeight: 800, fontSize: '22px', margin: '10px 0 4px' }}>
              זרימת מועמדת — מרישום עד השמה
            </h2>
          </div>
          <RoleSection
            color={PURPLE}
            emoji="👩‍🎓"
            role="מועמדת"
            tagline="שליחת חינוך המחפשת תפקיד ברשת"
            steps={[
              { title: 'קבלת קוד גישה', sub: 'המנהלת שולחת קוד אישי — בלעדיו לא ניתן להירשם' },
              { title: 'הרשמה ופרופיל', sub: 'כניסה עם Google, מילוי פרטים אקדמיים, העלאת קורות חיים' },
              { title: 'גלישה במשרות', sub: 'חיפוש לפי עיר, תחום, סוג מוסד — כל המשרות הפעילות ברשת' },
              { title: 'הגשת מועמדות', sub: 'לחיצה אחת + הודעה אישית אופציונלית למוסד' },
              { title: 'מעקב והזמנה לראיון', sub: 'עדכונים בזמן אמת: נצפתה / הוזמנת לראיון / התקבלת' },
              { title: 'ראיון והשמה', sub: 'אישור/סירוב הזמנה, ראיון, קבלת תשובה סופית' },
              { title: 'שאלון שביעות רצון', sub: '30 יום אחרי קבלה — קישור אישי במייל להשארת משוב' },
            ]}
            features={[
              { icon: '🔍', label: 'חיפוש חכם' },
              { icon: '📄', label: 'פרופיל מקצועי' },
              { icon: '📬', label: 'עדכונים במייל' },
              { icon: '📱', label: 'SMS ו-WhatsApp' },
              { icon: '🗓', label: 'תיאום ראיונות' },
              { icon: '🔔', label: 'התראות דחיפה' },
              { icon: '⭐', label: 'שאלון שביעות' },
              { icon: '📊', label: 'מעקב הגשות' },
            ]}
          />
        </div>

        {/* ── Institution ── */}
        <div id="institution">
          <div style={{ marginBottom: 20 }}>
            <Badge text="מוסד" color="#1976D2" />
            <h2 style={{ color: '#1F1F2E', fontWeight: 800, fontSize: '22px', margin: '10px 0 4px' }}>
              זרימת מוסד — מרישום עד גיוס
            </h2>
          </div>
          <RoleSection
            color="#1976D2"
            emoji="🏫"
            role="מוסד"
            tagline="בית ספר / גן / מוסד חינוכי ברשת"
            steps={[
              { title: 'הצטרפות למערכת', sub: 'Admin מוסיף מוסד ← מייל הזמנה אוטומטי עם קישור כניסה' },
              { title: 'השלמת פרופיל', sub: 'שם, כתובת, טלפון, איש קשר — כל הפרטים נשמרים' },
              { title: 'פרסום משרה', sub: 'כותרת, תיאור, עיר, תחום, תנאי העסקה, תאריך תפוגה' },
              { title: 'קבלת הגשות', sub: 'הגשות מגיעות עם פרופיל מלא — קורות חיים, ניסיון, תחומים' },
              { title: 'סקירה ופעולה', sub: 'לדחות / לשלוח הזמנה לראיון / לסמן "נצפה"' },
              { title: 'ניהול ראיונות', sub: 'קביעת תאריך ומיקום, עדכון אוטומטי למועמדת' },
              { title: 'קבלה / דחייה', sub: 'תשובה סופית + שאלון שביעות רצון אוטומטי לאחר 30 יום' },
            ]}
            features={[
              { icon: '📋', label: 'פרסום משרות' },
              { icon: '👥', label: 'מאגר מועמדות' },
              { icon: '📩', label: 'הזמנה לראיון' },
              { icon: '📅', label: 'יומן ראיונות' },
              { icon: '📧', label: 'מייל אוטומטי' },
              { icon: '📱', label: 'SMS' },
              { icon: '⏰', label: 'תפוגת משרה' },
              { icon: '⭐', label: 'שאלון משוב' },
            ]}
          />
        </div>

        {/* ── Admin ── */}
        <div id="admin">
          <div style={{ marginBottom: 20 }}>
            <Badge text="הנהלה" color="#2E7D32" />
            <h2 style={{ color: '#1F1F2E', fontWeight: 800, fontSize: '22px', margin: '10px 0 4px' }}>
              זרימת הנהלה — שליטה מלאה על המערכת
            </h2>
          </div>
          <RoleSection
            color="#2E7D32"
            emoji="🛠"
            role="הנהלה"
            tagline="מנהלת המערכת ברשת אהלי יוסף יצחק"
            steps={[
              { title: 'דשבורד KPIs', sub: 'מבט על כלל המערכת: מוסדות, מועמדות, הגשות, ראיונות' },
              { title: 'ניהול מוסדות', sub: 'הוספה ידנית (מייל הזמנה אוטומטי) + אישור/דחייה של מוסדות שנרשמו בעצמם' },
              { title: 'ניהול מועמדות', sub: 'צפייה בכל הפרופילים, יצוא לאקסל, מעקב קודי גישה' },
              { title: 'ניהול משרות', sub: 'צפייה בכל המשרות הפעילות, פגות, ממתינות' },
              { title: 'מעקב הגשות', sub: 'כל ההגשות ברמת הרשת — סטטוס, מוסד, מועמדת' },
              { title: 'ניהול קודי גישה', sub: 'יצירת קודים, שיוך למועמדת, מעקב שימוש' },
              { title: 'סיכום שבועי', sub: 'מייל אוטומטי כל יום א׳ עם נתוני פעילות המערכת' },
            ]}
            features={[
              { icon: '📊', label: 'KPI Dashboard' },
              { icon: '🏫', label: 'ניהול מוסדות' },
              { icon: '👩‍🎓', label: 'ניהול מועמדות' },
              { icon: '💼', label: 'ניהול משרות' },
              { icon: '🔑', label: 'קודי גישה' },
              { icon: '📈', label: 'דוחות ונתונים' },
              { icon: '🔔', label: 'התראות מנהל' },
              { icon: '📧', label: 'סיכום שבועי' },
            ]}
          />
        </div>

        {/* ── Automations ── */}
        <div id="automations">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Badge text="⚡ אוטומציות" color="#B45309" />
            <h2 style={{ color: '#1F1F2E', fontWeight: 800, fontSize: '22px', margin: '10px 0 8px' }}>
              8 אוטומציות שעובדות בשבילכם כל יום
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: 1.6 }}>
              כל תהליך בנוי להיות ידנה כמה שפחות. האוטומציות רצות מדי יום בבוקר.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <AutoCard
              emoji="⏰"
              title="תזכורת ראיון — 24 שעות לפני"
              detail="מועמדת שיש לה ראיון מחר מקבלת מייל + SMS אוטומטי עם פרטי הראיון ומיקום."
            />
            <AutoCard
              emoji="📩"
              title="תזכורת הזמנה — יום 3"
              detail="אם מועמדת לא הגיבה להזמנה לראיון תוך 3 ימים, נשלחת תזכורת במייל ו-SMS."
            />
            <AutoCard
              emoji="🚨"
              title="אזהרת פקיעת הזמנה — יום 6"
              detail="יום לפני שההזמנה פוגת — SMS ״ההזמנה תפוג מחר״ כדי לעודד תגובה."
            />
            <AutoCard
              emoji="❌"
              title="פקיעת הזמנה — יום 7"
              detail="הזמנה שלא קיבלה תגובה תוך 7 ימים עוברת אוטומטית לסטטוס ׳פגה תוקף׳."
            />
            <AutoCard
              emoji="💼"
              title="פקיעת משרה + אזהרה 3 ימים לפני"
              detail="משרה שהגיעה לתאריך התפוגה נסגרת אוטומטית. 3 ימים לפני נשלחת התראה למוסד."
            />
            <AutoCard
              emoji="⚠️"
              title="הגשות ממתינות — 3+ ימים"
              detail="אם מוסד לא טיפל בהגשה מעל 3 ימים, מנהלת המערכת מקבלת התראה במייל."
            />
            <AutoCard
              emoji="📝"
              title="שאלון שביעות רצון — 30 יום"
              detail="30 יום אחרי קבלת מועמדת — מייל אוטומטי לשתיהן (מועמדת ומוסד) עם שאלון קצר."
            />
            <AutoCard
              emoji="📊"
              title="סיכום שבועי להנהלה"
              detail="כל יום א׳ — מייל עם נתוני שבוע: הגשות חדשות, ראיונות קרובים, משרות, מועמדות."
            />
          </div>
        </div>

        {/* ── Comms ── */}
        <div id="comms">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Badge text="📧 ערוצי תקשורת" color={PURPLE2} />
            <h2 style={{ color: '#1F1F2E', fontWeight: 800, fontSize: '22px', margin: '10px 0 8px' }}>
              5 ערוצים, מסר אחד בזמן הנכון
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { emoji: '📧', label: 'מייל', desc: 'כל אירוע חשוב', color: PURPLE },
              { emoji: '📱', label: 'SMS', desc: 'תזכורות חיוניות', color: '#1976D2' },
              { emoji: '💬', label: 'WhatsApp', desc: 'התראות מיידיות', color: '#25D366' },
              { emoji: '🔔', label: 'In-App', desc: 'פעמון בדשבורד', color: '#F59E0B' },
              { emoji: '📲', label: 'Push (PWA)', desc: 'אפשר להתקין כ-App', color: '#E53935' },
            ].map(c => (
              <div key={c.label} style={{
                background: '#fff', borderRadius: 14, padding: '20px 14px', textAlign: 'center',
                border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: c.color, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Email events ── */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '28px 32px',
          border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,.07)',
        }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#1F1F2E', marginBottom: 20 }}>
            📧 כל האירועים שמפעילים שליחת מייל
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              '✅ ברוכה הבאה — מועמדת חדשה',
              '📬 בקשת מוסד התקבלה — ממתין לאישור',
              '✅ מוסד אושר',
              '❌ מוסד נדחה',
              '📋 הגשה חדשה → למוסד',
              '👁 הגשה נצפתה → למועמדת',
              '📩 הזמנה לראיון → למועמדת',
              '🗓 ראיון נקבע → למועמדת',
              '⏰ תזכורת הזמנה יום 3 → למועמדת',
              '⏰ תזכורת ראיון 24ש → למועמדת',
              '🎉 התקבלת! → למועמדת',
              '😔 לא התקבלת → למועמדת',
              '📝 שאלון שביעות רצון — מועמדת',
              '📝 שאלון שביעות רצון — מוסד',
              '⚠️ הגשות ממתינות → למנהלת',
              '📊 סיכום שבועי → למנהלת',
            ].map(e => (
              <div key={e} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: BG, fontSize: '12.5px', color: '#374151', fontWeight: 600,
              }}>
                {e}
              </div>
            ))}
          </div>
        </div>

        {/* ── Security ── */}
        <div style={{
          background: `linear-gradient(135deg, ${PURPLE}0a, ${CYAN}08)`,
          border: `1px solid ${PURPLE}20`,
          borderRadius: 20, padding: '28px 32px',
        }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#1F1F2E', marginBottom: 16 }}>
            🔒 אבטחה ובקרת גישה
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '🔑', label: 'קודי גישה לחד-פעמיים', desc: 'מועמדת לא יכולה להירשם ללא קוד מהמנהלת' },
              { icon: '✉️', label: 'הזמנה במייל למוסדות', desc: 'מוסד מקבל magic link מאובטח דרך Supabase' },
              { icon: '🛡', label: 'Row Level Security', desc: 'כל משתמש רואה רק את הנתונים שלו (RLS)' },
              { icon: '👤', label: '3 רמות הרשאה', desc: 'מועמדת / מוסד / מנהלת — גישה מדורגת לכל דף' },
              { icon: '🔐', label: 'Auth עם Google', desc: 'כניסה מאובטחת דרך OAuth — ללא סיסמאות מקומיות' },
              { icon: '🕐', label: 'Cron Secret', desc: 'כל API של Cron מאומת עם Bearer token סודי' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '14px', background: '#fff', borderRadius: 12,
                border: '1px solid #E5E7EB',
              }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1F1F2E' }}>{s.label}</div>
                  <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick links ── */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#9CA3AF', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            כניסה למערכת
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '👩‍🎓 מועמדת', href: '/mosad' },
              { label: '🏫 מוסד', href: '/mumedet' },
              { label: '🛠 הנהלה', href: '/nehal' },
            ].map(l => (
              <a key={l.href} href={l.href} style={{
                display: 'inline-block', padding: '12px 28px', borderRadius: 12,
                fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                color: '#fff', boxShadow: `0 4px 16px ${PURPLE}40`,
              }}>{l.label}</a>
            ))}
          </div>
        </div>

      </div>

      {/* ══ FOOTER ══ */}
      <div style={{
        background: `linear-gradient(135deg, ${PURPLE}, #2a1a5e)`,
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/logo-chabad.png" alt="רשת אהלי יוסף יצחק" width={32} height={32}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: .85 }} />
          </div>
        </div>
        <div style={{ color: GOLD, fontWeight: 800, fontSize: '16px', marginBottom: 6 }}>
          מערכת גיוס והשמה · רשת אהלי יוסף יצחק
        </div>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '12px' }}>
          giuus.vercel.app · 2026
        </div>
      </div>
    </div>
  )
}
