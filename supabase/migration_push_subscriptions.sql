-- Web Push subscriptions per user/device

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_profile ON push_subscriptions(profile_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only owner can read/write their own subscriptions
CREATE POLICY "push_subs_select" ON push_subscriptions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "push_subs_insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "push_subs_delete" ON push_subscriptions FOR DELETE USING (auth.uid() = profile_id);
