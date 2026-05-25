-- Repara FK clubs → leagues sin ON DELETE CASCADE (p. ej. clubs_league_id_fkey en Supabase).
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_league_id_fkey;
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_league_id_leagues_id_fk;

ALTER TABLE public.clubs
  ADD CONSTRAINT clubs_league_id_leagues_id_fk
  FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;
