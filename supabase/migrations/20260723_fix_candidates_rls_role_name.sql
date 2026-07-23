-- תיקון רגרסיה: מדיניות ה-RLS "institutions can read candidates" שנוצרה ב-
-- 20260713_institution_approval_gate.sql בדקה role IN ('מנהל רשת', 'אדמין מערכת')
-- וזרקה בטעות את 'מנהלת מערכת' — שם התפקיד הקנוני של רוב חשבונות האדמין
-- (ראו lib/types.ts). התוצאה: כל אדמין עם role='מנהלת מערכת' מקבל טבלת
-- מועמדות ריקה בשקט (RLS חוסם, לא שגיאה) בכל קריאה עם anon/session client.
--
-- מריצים DROP+CREATE (לא ALTER POLICY) כדי לשמור על אותה תבנית כמו המיגרציה
-- המקורית. שאר 12+ בדיקות ה-role בקובץ הזה כבר משתמשות ב-'מנהלת מערכת' —
-- כאן רק משווים אליהן, כולל שלושת השמות למקרה שיש בפרודקשן פרופילים ישנים
-- שנשארו עם role='מנהל רשת'.

DROP POLICY IF EXISTS "institutions can read candidates" ON candidates;
CREATE POLICY "institutions can read candidates"
  ON candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהלת מערכת', 'אדמין מערכת', 'מנהל רשת')
    )
    OR EXISTS (
      SELECT 1 FROM institutions i
      WHERE i.profile_id = auth.uid()
        AND i.is_approved = true
    )
  );
