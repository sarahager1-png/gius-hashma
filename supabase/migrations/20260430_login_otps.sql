-- SMS OTP verification table
CREATE TABLE IF NOT EXISTS login_otps (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      text        NOT NULL,
  code       text        NOT NULL,
  attempts   int         NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified   boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE login_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access; no user-facing RLS policy
CREATE POLICY "no direct access" ON login_otps USING (false);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS login_otps_user_id_idx ON login_otps (user_id, created_at DESC);
