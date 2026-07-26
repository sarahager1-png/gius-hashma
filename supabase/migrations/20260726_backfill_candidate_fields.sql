-- ============================================================
-- השלמת פרטי מועמדות שנשמרו בבקשת ההצטרפות אך לא הועתקו לפרופיל
-- מריצים ב-Supabase SQL Editor. בטוח להרצה חוזרת — COALESCE ממלא רק שדות ריקים.
-- ============================================================

-- 1) כמה שדות חסרים היום למרות שהם קיימים בבקשה
SELECT
  count(*) FILTER (WHERE c.photo_url      IS NULL AND cr.photo_url      IS NOT NULL) AS חסר_תמונה,
  count(*) FILTER (WHERE c.work_cities    IS NULL AND cr.work_cities    IS NOT NULL) AS חסר_ערי_עבודה,
  count(*) FILTER (WHERE c.practical_work IS NULL AND cr.practical_work IS NOT NULL) AS חסר_עבודה_מעשית,
  count(*) FILTER (WHERE c.experiences    IS NULL AND cr.experiences    IS NOT NULL) AS חסר_ניסיון,
  count(*) FILTER (WHERE c.study_day      IS NULL AND cr.study_day      IS NOT NULL) AS חסר_יום_לימודים,
  count(*) FILTER (WHERE c.college        IS NULL AND cr.college        IS NOT NULL) AS חסר_מכללה,
  count(*) AS סך_מועמדות_עם_בקשה
FROM candidates c
JOIN candidate_requests cr ON cr.profile_id = c.profile_id;

-- 2) השלמה מהבקשה המקושרת
UPDATE candidates c
SET photo_url            = coalesce(c.photo_url,            cr.photo_url),
    work_cities          = coalesce(c.work_cities,          cr.work_cities),
    practical_work       = coalesce(c.practical_work,       cr.practical_work),
    experiences          = coalesce(c.experiences,          cr.experiences),
    study_day            = coalesce(c.study_day,            cr.study_day),
    college              = coalesce(c.college,              cr.college),
    specialization       = coalesce(c.specialization,       cr.specialization),
    academic_level       = coalesce(c.academic_level,       cr.academic_level),
    district             = coalesce(c.district,             cr.district),
    city                 = coalesce(c.city,                 cr.city),
    address              = coalesce(c.address,              cr.address),
    birth_year           = coalesce(c.birth_year,           cr.birth_year),
    marital_status       = coalesce(c.marital_status,       cr.marital_status),
    maiden_name          = coalesce(c.maiden_name,          cr.maiden_name),
    seniority_years      = coalesce(c.seniority_years,      cr.seniority_years),
    handwriting_font     = coalesce(c.handwriting_font,     cr.handwriting_font),
    technical_skills     = coalesce(c.technical_skills,     cr.technical_skills),
    interpersonal_skills = coalesce(c.interpersonal_skills, cr.interpersonal_skills),
    shlichut_location    = coalesce(c.shlichut_location,    cr.shlichut_location),
    shlichut_years       = coalesce(c.shlichut_years,       cr.shlichut_years),
    past_projects        = coalesce(c.past_projects,        cr.past_projects),
    personal_note        = coalesce(c.personal_note,        cr.personal_note),
    availability_from    = coalesce(c.availability_from,    cr.availability_from),
    availability_to      = coalesce(c.availability_to,      cr.availability_to),
    graduation_year      = coalesce(c.graduation_year,      cr.graduation_year),
    whatsapp_preference  = coalesce(c.whatsapp_preference,  cr.whatsapp_preference, true)
FROM candidate_requests cr
WHERE cr.profile_id = c.profile_id;

-- 3) אותו דבר לבקשות שלא קושרו ל-profile_id (התאמה לפי אימייל)
UPDATE candidates c
SET photo_url            = coalesce(c.photo_url,            cr.photo_url),
    work_cities          = coalesce(c.work_cities,          cr.work_cities),
    practical_work       = coalesce(c.practical_work,       cr.practical_work),
    experiences          = coalesce(c.experiences,          cr.experiences),
    study_day            = coalesce(c.study_day,            cr.study_day),
    college              = coalesce(c.college,              cr.college),
    specialization       = coalesce(c.specialization,       cr.specialization),
    academic_level       = coalesce(c.academic_level,       cr.academic_level),
    district             = coalesce(c.district,             cr.district),
    city                 = coalesce(c.city,                 cr.city),
    birth_year           = coalesce(c.birth_year,           cr.birth_year),
    marital_status       = coalesce(c.marital_status,       cr.marital_status),
    seniority_years      = coalesce(c.seniority_years,      cr.seniority_years),
    shlichut_location    = coalesce(c.shlichut_location,    cr.shlichut_location),
    availability_from    = coalesce(c.availability_from,    cr.availability_from),
    availability_to      = coalesce(c.availability_to,      cr.availability_to)
FROM auth.users u
JOIN candidate_requests cr ON lower(cr.email) = lower(u.email)
WHERE u.id = c.profile_id
  AND cr.profile_id IS NULL;

-- 4) בדיקה חוזרת — אמור להחזיר אפסים
SELECT
  count(*) FILTER (WHERE c.photo_url      IS NULL AND cr.photo_url      IS NOT NULL) AS חסר_תמונה,
  count(*) FILTER (WHERE c.work_cities    IS NULL AND cr.work_cities    IS NOT NULL) AS חסר_ערי_עבודה,
  count(*) FILTER (WHERE c.practical_work IS NULL AND cr.practical_work IS NOT NULL) AS חסר_עבודה_מעשית
FROM candidates c
JOIN candidate_requests cr ON cr.profile_id = c.profile_id;
