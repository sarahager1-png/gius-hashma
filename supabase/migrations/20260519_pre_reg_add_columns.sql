-- Add missing columns to pre_registered_institutions
-- These are needed so district, school_type and phone survive until first Google login

ALTER TABLE pre_registered_institutions
  ADD COLUMN IF NOT EXISTS district   text,
  ADD COLUMN IF NOT EXISTS school_type text,
  ADD COLUMN IF NOT EXISTS phone      text;

-- Drop the old restrictive institution_type check (values no longer match)
ALTER TABLE pre_registered_institutions
  DROP CONSTRAINT IF EXISTS pre_registered_institutions_institution_type_check;
