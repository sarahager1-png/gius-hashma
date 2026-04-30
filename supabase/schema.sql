-- ============================================================
-- גיוס והשמה — Database Schema
-- ============================================================

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('מועמדת', 'מוסד', 'מנהל רשת', 'אדמין מערכת')),
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );

CREATE POLICY "service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- candidates
-- ============================================================
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city text,
  college text,
  graduation_year int,
  specialization text CHECK (specialization IN ('גן ילדים', 'יסודי', 'שניהם')),
  academic_level text CHECK (academic_level IN ('סטאג''', 'בוגרת', 'מנוסה')),
  availability_status text NOT NULL DEFAULT 'מחפשת סטאג'''
    CHECK (availability_status IN ('מחפשת סטאג''', 'משובצת', 'בוגרת מחפשת משרה', 'פתוחה להצעות', 'לא פעילה')),
  bio text,
  cv_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- candidates can read/update their own row
CREATE POLICY "candidate can manage own row"
  ON candidates FOR ALL
  USING (
    profile_id = auth.uid()
  );

-- institutions can read all candidates
CREATE POLICY "institutions can read candidates"
  ON candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מוסד', 'מנהל רשת', 'אדמין מערכת')
    )
  );

-- admins can update any candidate
CREATE POLICY "admins can update candidates"
  ON candidates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );


-- ============================================================
-- institutions
-- ============================================================
CREATE TABLE institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  city text,
  address text,
  phone text,
  institution_type text CHECK (institution_type IN ('גן ילדים', 'בית ספר יסודי', 'מוסד אחר')),
  is_approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- institution can read/update own row
CREATE POLICY "institution can manage own row"
  ON institutions FOR ALL
  USING (profile_id = auth.uid());

-- candidates can read approved institutions
CREATE POLICY "candidates can read approved institutions"
  ON institutions FOR SELECT
  USING (
    is_approved = true
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'מועמדת'
    )
  );

-- admins can read/update all institutions
CREATE POLICY "admins can manage all institutions"
  ON institutions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );


-- ============================================================
-- jobs
-- ============================================================
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  city text,
  specialization text CHECK (specialization IN ('גן ילדים', 'יסודי', 'שניהם')),
  job_type text CHECK (job_type IN ('סטאג''', 'חלקי', 'מלא')),
  status text NOT NULL DEFAULT 'פעילה'
    CHECK (status IN ('פעילה', 'מושהית', 'אוישה', 'בוטלה', 'פג תוקפה')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- institution can manage their own jobs
CREATE POLICY "institution can manage own jobs"
  ON jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM institutions i
      WHERE i.id = institution_id
        AND i.profile_id = auth.uid()
    )
  );

-- candidates can read active jobs from approved institutions
CREATE POLICY "candidates can read active jobs"
  ON jobs FOR SELECT
  USING (
    status = 'פעילה'
    AND EXISTS (
      SELECT 1 FROM institutions i
      WHERE i.id = institution_id AND i.is_approved = true
    )
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'מועמדת'
    )
  );

-- admins can read all jobs
CREATE POLICY "admins can read all jobs"
  ON jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );


-- ============================================================
-- applications
-- ============================================================
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה', 'נצפתה', 'התקבלה', 'נדחתה', 'בוטלה')),
  cover_letter text,
  institution_notes text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- candidate can see and cancel own applications
CREATE POLICY "candidate can manage own applications"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = candidate_id
        AND c.profile_id = auth.uid()
    )
  );

-- institution can see and update applications for their jobs
CREATE POLICY "institution can manage job applications"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN institutions i ON i.id = j.institution_id
      WHERE j.id = job_id
        AND i.profile_id = auth.uid()
    )
  );

-- admins can see all applications
CREATE POLICY "admins can read all applications"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );


-- ============================================================
-- candidates — extended columns
-- ============================================================
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS birth_year int,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS maiden_name text,
  ADD COLUMN IF NOT EXISTS seniority_years text,
  ADD COLUMN IF NOT EXISTS handwriting_font text,
  ADD COLUMN IF NOT EXISTS technical_skills text,
  ADD COLUMN IF NOT EXISTS interpersonal_skills text,
  ADD COLUMN IF NOT EXISTS experiences jsonb,
  ADD COLUMN IF NOT EXISTS practical_work jsonb,
  ADD COLUMN IF NOT EXISTS shlichut_location text,
  ADD COLUMN IF NOT EXISTS shlichut_years text,
  ADD COLUMN IF NOT EXISTS past_projects text,
  ADD COLUMN IF NOT EXISTS personal_note text,
  ADD COLUMN IF NOT EXISTS availability_from date,
  ADD COLUMN IF NOT EXISTS availability_to date,
  ADD COLUMN IF NOT EXISTS placement_location text,
  ADD COLUMN IF NOT EXISTS prev_employer text,
  ADD COLUMN IF NOT EXISTS prev_role text,
  ADD COLUMN IF NOT EXISTS years_experience int;

-- ============================================================
-- jobs — extended columns
-- ============================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS placement_type text,
  ADD COLUMN IF NOT EXISTS district text;

-- ============================================================
-- applications — extended columns
-- ============================================================
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS placement_date date;

-- ============================================================
-- candidate_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  district text,
  city text,
  address text,
  birth_year int,
  marital_status text,
  maiden_name text,
  college text,
  specialization text,
  academic_level text,
  graduation_year int,
  seniority_years text,
  handwriting_font text,
  experiences jsonb,
  practical_work jsonb,
  shlichut_location text,
  shlichut_years text,
  technical_skills text,
  interpersonal_skills text,
  past_projects text,
  personal_note text,
  availability_from date,
  availability_to date,
  status text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה', 'אושרה', 'נדחתה')),
  access_code text,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "admins can manage candidate requests"
  ON candidate_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );

-- public submission via service role — no auth needed
CREATE POLICY IF NOT EXISTS "service role can insert candidate requests"
  ON candidate_requests FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- access_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "admins can manage access codes"
  ON access_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- invitations
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה', 'התקבלה', 'נדחתה')),
  message text,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(institution_id, candidate_id, job_id)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "candidate can manage own invitations"
  ON invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = candidate_id AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "institution can manage own invitations"
  ON invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM institutions i
      WHERE i.id = institution_id AND i.profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "admins can manage all invitations"
  ON invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('מנהל רשת', 'אדמין מערכת')
    )
  );

-- ============================================================
-- interviews
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  location text,
  notes text,
  candidate_confirmed boolean,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "candidate can view own interviews"
  ON interviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      WHERE a.id = application_id AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "candidate can update own interviews"
  ON interviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      WHERE a.id = application_id AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "institution can view interviews for own jobs"
  ON interviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN institutions i ON i.id = j.institution_id
      WHERE a.id = application_id AND i.profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "service role can insert and update interviews"
  ON interviews FOR ALL
  WITH CHECK (true);

-- ============================================================
-- auto-update updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- candidate_inquiries — candidate-initiated contact with institution
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'ממתינה'
    CHECK (status IN ('ממתינה', 'נצפתה', 'נענתה')),
  institution_reply text,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, institution_id)
);

ALTER TABLE candidate_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "candidate can manage own inquiries"
  ON candidate_inquiries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM candidates c WHERE c.id = candidate_id AND c.profile_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "institution can read and reply to own inquiries"
  ON candidate_inquiries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM institutions i WHERE i.id = institution_id AND i.profile_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "admins can manage all inquiries"
  ON candidate_inquiries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת', 'אדמין מערכת'))
  );

-- ============================================================
-- migration: jobs end_date + candidates study_day
-- ============================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS study_day text;

ALTER TABLE candidate_requests
  ADD COLUMN IF NOT EXISTS study_day text;
