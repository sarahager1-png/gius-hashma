-- Persistent message threads between institutions and candidates

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         text,
  body            text NOT NULL,
  related_job_id  uuid REFERENCES jobs(id) ON DELETE SET NULL,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_to   ON messages(to_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_profile_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can read their own messages
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (auth.uid() = from_profile_id OR auth.uid() = to_profile_id);

-- Any authenticated user can send
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (auth.uid() = from_profile_id);

-- Recipient can mark as read
CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (auth.uid() = to_profile_id)
  WITH CHECK (auth.uid() = to_profile_id);
