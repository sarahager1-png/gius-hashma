import Link from 'next/link'

export default function TermsPage() {
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
            תנאי שימוש
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
          <Section title="1. שימוש במערכת">
            <p>
              מערכת הגיוס של רשת אהלי יוסף יצחק (להלן: &quot;המערכת&quot;) מיועדת לשימוש מורשה בלבד, על ידי
              מועמדות, מוסדות חינוך ומנהלי מערכת הפועלים מטעם הרשת.
            </p>
            <p>
              המשתמש/ת מתחייב/ת לספק מידע מדויק ועדכני בעת הרישום, ולא לעשות שימוש במערכת
              למטרות בלתי חוקיות או הפוגעות בזכויות אחרים.
            </p>
            <p>
              אין להעביר פרטי גישה לאחרים, ואין לנסות לגשת לחלקי המערכת שאינם מורשים לך.
            </p>
          </Section>

          <Section title="2. פרטיות וסודיות">
            <p>
              המידע האישי שמסרת במסגרת הרישום מוגן ומטופל בהתאם למדיניות הפרטיות שלנו.
              לא נעביר את פרטיך לצדדים שלישיים ללא הסכמתך, למעט במקרים הנדרשים על פי חוק.
            </p>
            <p>
              חיבור בין מועמדת למוסד מתבצע אך ורק דרך המערכת, ואין לפרסם פרטי קשר של
              צדדים אחרים מחוץ למסגרת המערכת.
            </p>
          </Section>

          <Section title="3. הגבלת אחריות">
            <p>
              הרשת אינה אחראית לנזקים שנגרמו כתוצאה מהסתמכות על המידע המופיע במערכת,
              לרבות טעויות, שגיאות טכניות, או אי-זמינות זמנית של השירות.
            </p>
            <p>
              המערכת מסופקת &quot;כפי שהיא&quot; (as-is), ואנו שומרים לעצמנו את הזכות לשנות, להשהות
              או להפסיק כל שירות בכל עת ללא הודעה מוקדמת.
            </p>
            <p>
              אין ערובה לכך שהשימוש במערכת יביא לשיבוץ מוצלח. המערכת משמשת ככלי תיווך
              בלבד, וההחלטה הסופית נתונה בידי המוסד והמועמדת.
            </p>
          </Section>

          <Section title="4. שינויים בתנאים">
            <p>
              הרשת שומרת לעצמה את הזכות לעדכן תנאים אלה בכל עת. שינויים מהותיים יפורסמו
              בהודעה בתוך המערכת לפחות 7 ימים לפני כניסתם לתוקף.
            </p>
            <p>
              המשך השימוש במערכת לאחר כניסת השינויים לתוקף מהווה הסכמה לתנאים המעודכנים.
            </p>
          </Section>

          <Section title="5. יצירת קשר">
            <p>
              לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו בדוא&quot;ל:{' '}
              <a href="mailto:bina@reshetch.org.il" style={{ color: '#5B3EAE', fontWeight: 600 }}>
                bina@reshetch.org.il
              </a>
            </p>
          </Section>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/privacy"
            style={{ fontSize: '13px', color: '#5B3EAE', textDecoration: 'none', fontWeight: 600 }}
          >
            מדיניות פרטיות ←
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
