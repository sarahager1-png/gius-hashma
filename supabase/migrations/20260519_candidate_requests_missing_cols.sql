ALTER TABLE candidate_requests
  ADD COLUMN IF NOT EXISTS birth_year       int,
  ADD COLUMN IF NOT EXISTS marital_status   text,
  ADD COLUMN IF NOT EXISTS maiden_name      text,
  ADD COLUMN IF NOT EXISTS experiences      jsonb;
