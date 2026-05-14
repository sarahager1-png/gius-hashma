-- system_settings: key-value store for admin-editable global config
CREATE TABLE IF NOT EXISTS system_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read system settings" ON system_settings;
CREATE POLICY "authenticated users can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admins can manage system settings" ON system_settings;
CREATE POLICY "admins can manage system settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role::text IN ('מנהלת מערכת', 'אדמין מערכת')
    )
  );

-- Seed defaults (no-op if already present)
INSERT INTO system_settings (key, value) VALUES
  ('support_wa_number', ''),
  ('contact_email',     '')
ON CONFLICT (key) DO NOTHING;
