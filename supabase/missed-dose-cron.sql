-- VitaCare — schedule automatic missed-dose alerts (Feature B).
-- Run this in the Supabase SQL Editor AFTER deploying the `check-missed-doses`
-- Edge Function and setting its CRON_SECRET.
--
-- It enables pg_cron + pg_net and, every 15 minutes, calls the Edge Function,
-- which emails caregivers about overdue, unconfirmed doses.

-- 1. Extensions (available on Supabase, incl. free tier)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. (Re)schedule the job.
--    • Replace PASTE_YOUR_CRON_SECRET_HERE with the SAME value you set as the
--      function's CRON_SECRET secret.
--    • The URL already points at your project.
select cron.unschedule('vitacare-check-missed-doses')
where exists (
  select 1 from cron.job where jobname = 'vitacare-check-missed-doses'
);

select cron.schedule(
  'vitacare-check-missed-doses',
  '*/15 * * * *',                         -- every 15 minutes
  $$
  select net.http_post(
    url     := 'https://gufsgyrmaisqucnvmbrb.supabase.co/functions/v1/check-missed-doses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'PASTE_YOUR_CRON_SECRET_HERE'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Useful management queries:
--   select * from cron.job;                                  -- list jobs
--   select * from cron.job_run_details order by start_time desc limit 20;  -- recent runs
--   select cron.unschedule('vitacare-check-missed-doses');   -- stop it
