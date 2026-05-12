-- Auto-release escrow 48h after job completion if no dispute
-- Requires pg_cron extension

SELECT cron.schedule(
  'auto-release-cutcrew-escrow',
  '0 * * * *',
  $$
  UPDATE payments p
  SET
    status      = 'released',
    released_at = now()
  FROM contracts c
  JOIN jobs j ON j.id = c.job_id
  WHERE p.contract_id = c.id
    AND p.status      = 'escrowed'
    AND j.status      = 'in_progress'
    AND j.updated_at  < (now() - interval '48 hours');
  $$
);
