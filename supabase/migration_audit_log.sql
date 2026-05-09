CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  actor_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit_log" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('מנהלת מערכת','אדמין מערכת'))
);
CREATE POLICY "service insert audit_log" ON audit_log FOR INSERT WITH CHECK (true);
