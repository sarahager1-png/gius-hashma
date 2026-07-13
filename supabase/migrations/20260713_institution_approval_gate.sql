-- שער אישור מוסדות (13/7/26) — applied to prod via Management API
--
-- רקע: מוסד שנרשם בטופס הציבורי נכנס עם Google ואושר אוטומטית
-- (post-login יצר institutions עם is_approved=true), בלי שום אישור אדמין.
-- בנוסף, מדיניות ה-RLS על candidates אפשרה לכל פרופיל בתפקיד 'מוסד'
-- לקרוא את כל המועמדות — גם מוסד לא מאושר.

-- 1. auto_approve: רק מוסדות שהאדמין רשמה מראש (או אישרה בוואטסאפ לפני
--    כניסה ראשונה) נכנסים מאושרים; כל השאר ממתינים לאישור בפאנל האדמין.
ALTER TABLE pre_registered_institutions
  ADD COLUMN IF NOT EXISTS auto_approve boolean NOT NULL DEFAULT false;

-- המאגר שיובא ב-10/5/26 (31 מוסדות שנרשמו ע"י מנהלת הרשת) — כניסה חלקה כמו קודם
UPDATE pre_registered_institutions
  SET auto_approve = true
  WHERE created_at::date = '2026-05-10';

-- 2. סגירת פרצת ה-RLS: קריאת מועמדות מותרת רק למוסד מאושר (או אדמין)
DROP POLICY IF EXISTS "institutions can read candidates" ON candidates;
CREATE POLICY "institutions can read candidates"
  ON candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
    OR EXISTS (
      SELECT 1 FROM institutions i
      WHERE i.profile_id = auth.uid()
        AND i.is_approved = true
    )
  );
