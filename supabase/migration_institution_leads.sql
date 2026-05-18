-- Creates institution_leads table for pre-registered contacts
-- Run once in Supabase SQL Editor

CREATE TABLE institution_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name text NOT NULL,
  city text,
  phone text,
  institution_type text,
  created_at timestamptz DEFAULT now(),
  registered_profile_id uuid REFERENCES profiles(id)
);

ALTER TABLE institution_leads ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admins_all" ON institution_leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('מנהל רשת', 'מנהלת מערכת', 'אדמין מערכת')
    )
  );

-- Public read (for pre-filling the registration form)
CREATE POLICY "public_read_by_id" ON institution_leads FOR SELECT
  USING (true);
