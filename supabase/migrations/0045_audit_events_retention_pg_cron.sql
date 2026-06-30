-- BLQ-5.2 — Retención audit_events: job mensual pg_cron (Supabase).
-- Complementa script ops y /api/cron/purge-audit en Vercel.
-- En Postgres sin pg_cron (CI local), se omite sin error.

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron no disponible en este servidor; omitiendo job programado.';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'purge_audit_events_yearly';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'purge_audit_events_yearly',
    '0 4 1 * *',
    $$DELETE FROM public.audit_events WHERE created_at < now() - interval '1 year'$$
  );
END $$;
