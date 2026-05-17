-- Ensure one survey per (application, type) so upsert logic works
ALTER TABLE placement_surveys
  ADD CONSTRAINT placement_surveys_app_type_unique
  UNIQUE (application_id, survey_type);
