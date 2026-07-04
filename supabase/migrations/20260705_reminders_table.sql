-- The send-reminders cron (every 15 min) referenced this table but it was never
-- created. Recreated with target_phone so messages can be scheduled to people
-- who don't have an account yet (e.g. pre-registered principals).
-- Applied to live DB on 2026-07-05 via Management API.
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_phone text,
  channel text NOT NULL DEFAULT 'wa' CHECK (channel IN ('wa','sms','in_app')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage reminders" ON reminders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהלת מערכת','אדמין מערכת'))
);
