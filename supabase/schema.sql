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
