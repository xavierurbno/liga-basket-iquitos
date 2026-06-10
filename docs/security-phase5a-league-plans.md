# Fase 5a — Planes y límites por tenant (sin Stripe)

## Objetivo

Limitar operación por liga (`max_players`, `max_active_tournaments`) con override manual desde super-admin. Stripe queda reservado en columnas `stripe_*` para una fase posterior.

## Migración `0041_league_plans.sql`

- Enum `league_plan_tier`: `free`, `starter`, `pro`
- Tabla `league_plans` (PK `league_id` → `leagues`, CASCADE)
- Backfill ligas existentes: plan `free`, **500 jugadores**, **5 torneos activos** (LDDBI sin bloqueo operativo)
- Ligas nuevas vía wizard: defaults Drizzle/app **200 jugadores**, **2 torneos**

Aplicar:

```bash
node scripts/apply-migration-0041.mjs
```

## Capa aplicación

| Pieza | Ubicación |
|-------|-----------|
| Schema Drizzle | `src/lib/db/schema.ts` → `leaguePlans` |
| Repositorio | `src/repositories/leaguePlanRepository.ts` |
| Gates | `src/lib/leagues/assert-league-plan-limit.ts` |
| Alta jugador | `registrarJugadorAction` → `assertCanRegisterPlayer` |
| Alta torneo | `createTournamentWithFixture` → `assertCanCreateTournament` |
| Super-admin UI | `/super-admin/leagues/[leagueId]` — uso + formulario |
| Action override | `updateLeaguePlanAction` |

### Mensaje UX (sin Stripe)

> Has alcanzado el límite de tu plan. Contacta al administrador de la plataforma para ampliar tu plan.

`SUPER_ADMIN` omite gates en acciones operativas.

## Panel super-admin

En la ficha de liga:

1. **LeaguePlanUsagePanel** — barras jugadores / torneos activos vs límite
2. **LeaguePlanForm** — editar `plan`, `max_players`, `max_active_tournaments`, `trial_expires_at`

## Conteos

- **Jugadores**: filas en `players` con `league_id`
- **Torneos activos**: `tournaments` donde `status` ∉ `{ finished, cancelled }`

## Pendiente operacional

- [ ] Aplicar `0041` en staging y producción
- [ ] Verificar límites LDDBI (500/5) tras backfill

## Siguiente: Fase 5b

Rol PostgreSQL `liga_app`, `DATABASE_URL_APP`, RLS como segunda línea de defensa — ver plan maestro de seguridad.
