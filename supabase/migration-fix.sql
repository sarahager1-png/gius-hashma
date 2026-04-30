-- ============================================================
-- Migration: Fix CHECK constraints + Add missing columns
-- הרצה: Supabase Dashboard → SQL Editor → הדבקי והרצי
-- ============================================================

-- 1. תיקון constraints בטבלת candidates
-- -----------------------------------------------
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_specialization_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_specialization_check
  CHECK (specialization IN ('יסודי', 'חט"ב', 'מתמטיקה', 'אנגלית', 'חינוך מיוחד', 'אחר'));

ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_academic_level_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_academic_level_check
  CHECK (academic_level IN ('שנה ב'' - סטאג''', 'שנה ג'' - סטאג''', 'תואר ראשון', 'תואר שני'));

-- 2. תיקון constraints בטבלת jobs
-- -----------------------------------------------
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_specialization_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_specialization_check
  CHECK (specialization IN ('יסודי', 'חט"ב', 'מתמטיקה', 'אנגלית', 'חינוך מיוחד', 'אחר'));

-- 3. תיקון constraints בטבלת institutions
-- -----------------------------------------------
ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_institution_type_check;
ALTER TABLE institutions ADD CONSTRAINT institutions_institution_type_check
  CHECK (institution_type IN ('בית חינוך', 'קהילתי', 'שלהבות חב"ד'));

-- 4. עמודות חסרות בטבלת jobs
-- -----------------------------------------------
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS district       text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS placement_type text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date     date;

-- 5. עמודות חסרות בטבלת institutions
-- -----------------------------------------------
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS district text;

-- 6. עמודות חסרות בטבלת candidates
-- -----------------------------------------------
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS district              text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS address               text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_year            int;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS marital_status        text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS maiden_name           text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS seniority_years       int;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_experience      int;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS handwriting_font      text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS technical_skills      text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interpersonal_skills  text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability_from     date;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability_to       date;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS shlichut_location     text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS shlichut_years        text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS past_projects         text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS personal_note         text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_cv                boolean DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS placement_location    text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS supervisor_name       text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS supervisor_phone      text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS prev_employer         text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS prev_role             text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS special_skills        text;

-- 7. יצירת טבלת interviews (אם לא קיימת)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS interviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at        timestamptz NOT NULL,
  location            text,
  notes               text,
  candidate_confirmed boolean,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "institution can manage interviews"
    ON interviews FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM applications a
        JOIN jobs j      ON j.id = a.job_id
        JOIN institutions i ON i.id = j.institution_id
        WHERE a.id = application_id AND i.profile_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "candidate can read own interviews"
    ON interviews FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM applications a
        JOIN candidates c ON c.id = a.candidate_id
        WHERE a.id = application_id AND c.profile_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admins can manage all interviews"
    ON interviews FOR ALL
    USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת', 'אדמין מערכת'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. יצירת טבלת notifications (אם לא קיימת)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users can read own notifications"
    ON notifications FOR SELECT
    USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users can update own notifications"
    ON notifications FOR UPDATE
    USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service can insert notifications"
    ON notifications FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. יצירת טבלת invitations (אם לא קיימת)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   uuid NOT NULL REFERENCES candidates(id)   ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  job_id         uuid          REFERENCES jobs(id)         ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה', 'התקבלה', 'נדחתה', 'בוטלה')),
  scheduled_at   timestamptz,
  message        text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "candidate can read own invitations"
    ON invitations FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM candidates c WHERE c.id = candidate_id AND c.profile_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "institution can manage invitations"
    ON invitations FOR ALL
    USING (
      EXISTS (SELECT 1 FROM institutions i WHERE i.id = institution_id AND i.profile_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admins can manage all invitations"
    ON invitations FOR ALL
    USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת', 'אדמין מערכת'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. תיקון אבטחה: RLS עבור INSERT בטבלת candidates
-- -----------------------------------------------
DROP POLICY IF EXISTS "candidate can insert own row" ON candidates;
DO $$ BEGIN
  CREATE POLICY "candidate can insert own row"
    ON candidates FOR INSERT
    WITH CHECK (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- סיום — כל השינויים הוחלו
SELECT 'Migration completed successfully!' AS result;
