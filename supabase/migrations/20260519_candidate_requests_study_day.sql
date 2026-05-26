ALTER TABLE candidate_requests
  ADD COLUMN IF NOT EXISTS study_day text,
  ADD COLUMN IF NOT EXISTS whatsapp_preference boolean DEFAULT true;
