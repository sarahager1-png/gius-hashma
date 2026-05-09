ALTER TABLE institutions ADD COLUMN IF NOT EXISTS whatsapp_preference boolean DEFAULT true;
ALTER TABLE candidate_requests ADD COLUMN IF NOT EXISTS whatsapp_preference boolean DEFAULT true;
