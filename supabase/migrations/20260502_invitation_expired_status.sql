-- Add 'פגה תוקף' status to invitations table
-- Allows the cron job to automatically expire invitations after 7 days of no response

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_status_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_status_check
  CHECK (status IN ('ממתינה', 'התקבלה', 'נדחתה', 'פגה תוקף'));
