CREATE TABLE IF NOT EXISTS job_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  specialization text,
  job_type text,
  placement_type text
);
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "institutions manage own templates" ON job_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM institutions WHERE id = institution_id AND profile_id = auth.uid())
);
CREATE POLICY "admins manage templates" ON job_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('מנהלת מערכת','אדמין מערכת'))
);
