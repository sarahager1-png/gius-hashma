-- application status change log
CREATE TABLE IF NOT EXISTS application_status_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status    text,
  to_status      text NOT NULL,
  changed_at     timestamptz DEFAULT now()
);

ALTER TABLE application_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution can read status log"
  ON application_status_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j        ON j.id = a.job_id
    JOIN institutions i ON i.id = j.institution_id
    WHERE a.id = application_id
      AND i.profile_id = auth.uid()
  ));

CREATE POLICY "candidate can read own status log"
  ON application_status_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications a
    JOIN candidates c ON c.id = a.candidate_id
    WHERE a.id = application_id
      AND c.profile_id = auth.uid()
  ));

CREATE POLICY "admins can read all status logs"
  ON application_status_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('מנהלת מערכת', 'אדמין מערכת')
  ));

CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO application_status_log (application_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_status_log ON applications;
CREATE TRIGGER trg_application_status_log
  AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_application_status_change();
