-- Redes sociales por liga (portal público).

ALTER TABLE public.league_settings
  ADD COLUMN IF NOT EXISTS social_facebook_url text,
  ADD COLUMN IF NOT EXISTS social_instagram_url text,
  ADD COLUMN IF NOT EXISTS social_youtube_url text,
  ADD COLUMN IF NOT EXISTS social_tiktok_url text,
  ADD COLUMN IF NOT EXISTS social_whatsapp_url text;
