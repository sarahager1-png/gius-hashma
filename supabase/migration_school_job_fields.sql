-- Add school fields to institutions
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS school_type text,
  ADD COLUMN IF NOT EXISTS principal_name text;

-- Add structured job fields
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS classes text,
  ADD COLUMN IF NOT EXISTS hours text;
