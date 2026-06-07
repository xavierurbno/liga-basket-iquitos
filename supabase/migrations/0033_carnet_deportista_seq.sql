-- Correlativo global de carnets deportivos (seguro ante emisiones concurrentes vía nextval).
CREATE SEQUENCE IF NOT EXISTS public.carnet_deportista_seq
  AS bigint
  START WITH 1001
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Alinear la secuencia con números ya guardados (ej. IQ-2026-U11-0042 → 42).
DO $$
DECLARE
  max_seq bigint;
BEGIN
  SELECT COALESCE(
    MAX((regexp_match(trim(carnet_number), '-([0-9]+)$'))[1]::bigint),
    1000
  )
  INTO max_seq
  FROM public.players
  WHERE carnet_number IS NOT NULL
    AND trim(carnet_number) <> ''
    AND carnet_number ~ '-[0-9]+$';

  IF max_seq >= 1001 THEN
    PERFORM setval('public.carnet_deportista_seq', max_seq, true);
  END IF;
END $$;
