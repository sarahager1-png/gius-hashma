-- WhatsApp bot session tracking
CREATE TABLE IF NOT EXISTS wa_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('create_job', 'confirm_interview', 'confirm_invitation', 'survey')),
  state       text NOT NULL DEFAULT 'start',
  data        jsonb NOT NULL DEFAULT '{}',
  related_id  uuid,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_phone ON wa_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_expires ON wa_sessions(expires_at);

-- Auto-delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_wa_sessions() RETURNS void AS $$
  DELETE FROM wa_sessions WHERE expires_at < now();
$$ LANGUAGE sql;

-- Placement satisfaction surveys
CREATE TABLE IF NOT EXISTS placement_surveys (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  survey_type         text NOT NULL CHECK (survey_type IN ('candidate_about_institution', 'institution_about_candidate')),
  respondent_profile_id uuid NOT NULL REFERENCES profiles(id),
  token               text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  -- ratings (1-5)
  overall_rating      int CHECK (overall_rating BETWEEN 1 AND 5),
  q2_rating           int CHECK (q2_rating BETWEEN 1 AND 5),
  q3_rating           int CHECK (q3_rating BETWEEN 1 AND 5),
  recommend           boolean,
  notes               text,
  submitted_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_placement_surveys_application ON placement_surveys(application_id);
CREATE INDEX IF NOT EXISTS idx_placement_surveys_token ON placement_surveys(token);

-- WhatsApp message log
CREATE TABLE IF NOT EXISTS wa_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction   text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  phone       text NOT NULL,
  profile_id  uuid REFERENCES profiles(id),
  message     text NOT NULL,
  session_type text,
  related_id  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_log_phone ON wa_log(phone);
CREATE INDEX IF NOT EXISTS idx_wa_log_created ON wa_log(created_at DESC);

-- RLS: admins can read all, users can read nothing (admin-only)
ALTER TABLE wa_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_log          ENABLE ROW LEVEL SECURITY;

-- Only service role can write (all mutations go through service client)
-- Admins can read surveys
CREATE POLICY "admins_read_surveys" ON placement_surveys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('מנהלת מערכת', 'אדמין מערכת'))
  );

-- Respondent can read own survey (to check if submitted)
CREATE POLICY "own_survey_read" ON placement_surveys
  FOR SELECT USING (respondent_profile_id = auth.uid());

-- Admins can read wa_log
CREATE POLICY "admins_read_wa_log" ON wa_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('מנהלת מערכת', 'אדמין מערכת'))
  );
