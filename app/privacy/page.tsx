import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F7F5FF 0%, #F0FAFA 100%)',
        padding: '40px 24px',
        fontFamily: 'Heebo, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/login"
            style={{ fontSize: '13px', color: '#5B3EAE', textDecoration: 'none', fontWeight: 600 }}
          >
            ← חזרה
          </Link>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#1A1533',
              marginTop: '16px',
              marginBottom: '8px',
              letterSpacing: '-.03em',
            }}
          >
            מדיניות פרטיות
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>עדכון אחרון: מאי 2026</p>
        </div>

        {/* Content card */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #E8E4F3',
            boxShadow: '0 4px 24px rgba(91,62,174,.07)',
            padding: '40px',
            lineHeight: 1.8,
          }}
        >
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
            מדיניות פרטיות זו מסבירה כיצד מערכת הגיוס של רשת אהלי יוסף יצחק אוספת,
            משתמשת ומאחסנת מידע אישי של משתמשיה.
          </p>

          <Section title="1. איזה מידע נאסף">
            <p>
              במסגרת הרישום ושימוש במערכת, אנו עשויים לאסוף את המידע הבא:
            </p>
            <ul style={{ paddingRight: '20px', margin: 0 }}>
              <li><strong>פרטים מזהים:</strong> שם מלא, מספר טלפון, כתובת דוא&quot;ל</li>
              <li><strong>מיקום:</strong> עיר, מחוז, כתובת מגורים</li>
              <li><strong>פרטים מקצועיים:</strong> התמחות, רמה אקדמית, ניסיון מקצועי</li>
              <li><strong>קובץ קורות חיים (CV):</strong> קישור לקובץ שהועלה למערכת</li>
              <li><strong>מידע על שיבוצים:</strong> פניות, ראיונות, תוצאות</li>
            </ul>
          </Section>

          <Section title="2. מטרת האיסוף">
            <p>המידע נאסף לצורך:</p>
            <ul style={{ paddingRight: '20px', margin: 0 }}>
              <li>התאמת מועמדות למשרות מתאימות ברשת חינוך חב&quot;ד</li>
              <li>ניהול תהליכי גיוס, ראיונות ושיבוצים</li>
              <li>שליחת הודעות עדכון על מצב פנייה</li>
              <li>שיפור חוויית השימוש במערכת</li>
            </ul>
          </Section>

          <Section title="3. שמירת מידע">
            <p>
              המידע מאוחסן בשירות Supabase, בתשתית ענן מאובטחת. הנתונים מוגנים
              באמצעות הצפנה (TLS) בזמן העברה ובמנוחה.
            </p>
            <p>
              גישה למידע מוגבלת על פי הרשאות תפקיד: מועמדות רואות רק את הנתונים שלהן,
              מוסדות רואים רק פרטים רלוונטיים לתהליכי גיוס, ומנהלי מערכת עם הרשאה מלאה
              כפופים לחובת סודיות.
            </p>
          </Section>

          <Section title="4. זכות למחיקה">
            <p>
              בהתאם לחוק הגנת הפרטיות ולתקנות GDPR, יש לך זכות לבקש מחיקת המידע האישי שלך
              ממערכת. לאחר מחיקה, לא ניתן יהיה לשחזר את הנתונים.
            </p>
            <p>
              ניתן לבצע מחיקת חשבון עצמאית דרך עמוד ההגדרות במערכת, או לפנות אלינו ישירות.
            </p>
          </Section>

          <Section title="5. שיתוף מידע עם צדדים שלישיים">
            <p>
              אנו לא מוכרים ולא מעבירים מידע אישי לצדדים שלישיים למטרות שיווקיות.
              מידע עשוי להיחשף לספקי שירות טכנולוגי (כגון Supabase, Inforu לשליחת SMS)
              אך אך ורק לצורך מתן השירות עצמו.
            </p>
          </Section>

          <Section title="6. יצירת קשר">
            <p>
              לשאלות, בקשות מחיקה או כל פנייה אחרת בנושא פרטיות:{' '}
              <a href="mailto:bina@reshetch.org.il" style={{ color: '#5B3EAE', fontWeight: 600 }}>
                bina@reshetch.org.il
              </a>
            </p>
            <p>רשת אהלי יוסף יצחק · ניהול קייטנות וגיוס</p>
          </Section>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/terms"
            style={{ fontSize: '13px', color: '#5B3EAE', textDecoration: 'none', fontWeight: 600 }}
          >
            תנאי שימוש ←
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2
        style={{
          fontSize: '17px',
          fontWeight: 800,
          color: '#5B3EAE',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '2px solid #EDE9FE',
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: '14px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  )
}
