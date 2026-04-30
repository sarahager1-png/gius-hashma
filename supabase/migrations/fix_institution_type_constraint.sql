-- Update institution_type constraint to match new values
ALTER TABLE institutions
  DROP CONSTRAINT IF EXISTS institutions_institution_type_check;

ALTER TABLE institutions
  ADD CONSTRAINT institutions_institution_type_check
  CHECK (institution_type IN ('בית חינוך', 'קהילתי', 'שלהבות חב"ד'));
