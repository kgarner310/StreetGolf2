-- ============================================================
-- Auto-release escrow 24h after job coverage_date if no dispute
-- Requires pg_cron extension (enable in Supabase dashboard)
-- ============================================================

-- Enable pg_cron (run once as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: run every hour, release any overdue escrowed payments
SELECT cron.schedule(
  'auto-release-subroute-escrow',
  '0 * * * *',   -- every hour
  $$
  UPDATE payments p
  SET
    status      = 'released',
    released_at = now()
  FROM coverage_contracts c
  JOIN coverage_jobs j ON j.id = c.job_id
  WHERE p.contract_id = c.id
    AND p.status      = 'escrowed'
    AND j.coverage_date < (now() - interval '24 hours')::date
    AND j.status NOT IN ('disputed', 'cancelled');
  $$
);
