ALTER TABLE interviews ADD COLUMN IF NOT EXISTS institution_rating integer CHECK (institution_rating BETWEEN 1 AND 5);
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS institution_notes text;
