-- Fase 5a: planes y límites por liga (tenant).

DO $$ BEGIN
  CREATE TYPE public.league_plan_tier AS ENUM ('free', 'starter', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.league_plans (
  league_id uuid PRIMARY KEY REFERENCES public.leagues(id) ON DELETE CASCADE,
  plan public.league_plan_tier NOT NULL DEFAULT 'free',
  max_players integer NOT NULL DEFAULT 200,
  max_active_tournaments integer NOT NULL DEFAULT 2,
  trial_expires_at timestamptz,
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.league_plans IS
  'Límites operativos por liga (Fase 5a). Stripe reservado para Fase 6.';

INSERT INTO public.league_plans (league_id, plan, max_players, max_active_tournaments)
SELECT id, 'free', 500, 5
FROM public.leagues
ON CONFLICT (league_id) DO NOTHING;
