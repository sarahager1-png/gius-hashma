-- ============================================================
-- מילוי טלפונים חסרים בפרופילים של מועמדות
-- מריצים ב-Supabase SQL Editor. בטוח להריץ שוב ושוב (רק ממלא NULL).
-- ============================================================

-- 1) כמה חסרות טלפון כרגע
SELECT count(*) FILTER (WHERE p.phone IS NULL) AS ללא_טלפון,
       count(*)                                AS סך_מועמדות
FROM candidates c
JOIN profiles p ON p.id = c.profile_id;

-- 2) מילוי מתוך בקשת ההצטרפות המקושרת (profile_id)
UPDATE profiles p
SET phone = cr.phone
FROM candidate_requests cr
WHERE cr.profile_id = p.id
  AND p.phone IS NULL
  AND cr.phone IS NOT NULL;

-- 3) מילוי לפי אימייל (בקשות שלא קושרו ל-profile_id)
UPDATE profiles p
SET phone = cr.phone
FROM auth.users u
JOIN candidate_requests cr ON lower(cr.email) = lower(u.email)
WHERE u.id = p.id
  AND p.phone IS NULL
  AND cr.phone IS NOT NULL;

-- 4) מילוי מתוך הטלפון שנשמר במשתמש עצמו (הרשמות וואטסאפ / SMS)
UPDATE profiles p
SET phone = u.phone
FROM auth.users u
WHERE u.id = p.id
  AND p.phone IS NULL
  AND u.phone IS NOT NULL;

-- 5) בדיקה חוזרת — מי עדיין בלי טלפון
SELECT p.id, p.full_name, c.city, c.academic_level, u.email
FROM candidates c
JOIN profiles p ON p.id = c.profile_id
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.phone IS NULL
ORDER BY c.created_at DESC;
