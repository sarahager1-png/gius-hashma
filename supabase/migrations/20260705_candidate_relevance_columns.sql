-- Weekly relevance sweep — record each candidate's answer in the system.
-- relevance_response: 'רלוונטי' | 'ביקשה הסרה' | 'לא ענתה'
-- Applied to live DB on 2026-07-05 via Management API.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS relevance_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS relevance_response text;
