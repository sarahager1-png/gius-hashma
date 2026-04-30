ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_types text[] DEFAULT '{}';
UPDATE jobs SET job_types = ARRAY[job_type] WHERE job_type IS NOT NULL AND (job_types IS NULL OR job_types = '{}');
