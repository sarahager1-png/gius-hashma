-- Add 'לא מעוניינת' as a permanent "not interested" status on invitations.
-- Distinct from 'נדחתה' ("can't right now") — this signals the candidate
-- is permanently not interested, so the match should not resurface.

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_status_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_status_check
  CHECK (status IN ('ממתינה', 'התקבלה', 'נדחתה', 'לא מעוניינת'));
