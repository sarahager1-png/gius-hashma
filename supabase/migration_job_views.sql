ALTER TABLE jobs ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
CREATE OR REPLACE FUNCTION increment_job_views(job_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE jobs SET view_count = COALESCE(view_count, 0) + 1 WHERE id = job_id;
$$;
