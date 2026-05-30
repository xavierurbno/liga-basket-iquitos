# Fase 4 — Migraciones y bootstrap

## 4.1 Renumeración (2026-05)

| Antes | Después | Motivo |
|-------|---------|--------|
| `0001_add_transactions_tesoreria.sql` | `0012b_add_transactions_tesoreria.sql` | Colisión con `0001_shocking_enchantress` |
| `002_club_members_rls.sql` | `0012c_club_members_rls.sql` | Prefijo `002_` ambiguo vs `0002_fts` |
| `003_the_lock_league_settings.sql` | `0012d_the_lock_league_settings.sql` | Prefijo `003_` fuera de secuencia |
| `0006_league_settings_fix.sql` | `0006b_league_settings_fix.sql` | Colisión de clave `0006` con `0006_purple_stephen_strange` |

Orden canónico: `scripts/db-migration-manifest.mjs` (28 archivos).

Validación:

```bash
npm run db:validate:manifest
```

## 4.2 `rls_policies.sql`

Eliminado de `src/lib/db/`. Archivo de referencia: `docs/sql/archive/rls_policies_legacy.sql` (no se ejecuta).

RLS en pipeline solo vía SQL en `supabase/migrations/` (p. ej. `0017_rls_operational_league.sql`).

## Bootstrap idempotente

```bash
npm run db:validate:manifest
npm run db:bootstrap:dev    # BD vacía o re-ejecutable (errores benignos ignorados)
npm run db:verify:dev
```

`db-apply-all.mjs` valida el manifest antes de aplicar sentencias.

## Drizzle Kit vs manifest

`supabase/migrations/meta/_journal.json` cubre migraciones generadas por Drizzle (0001–0006). Las migraciones manuales `0007`–`0028` y `0012b`–`0012d` se aplican con **bootstrap**, no con `drizzle-kit migrate`.

## 4.4 Rol Postgres limitado (evaluación)

Ver `docs/database-connection-roles.md`. Sin cambio de código en esta fase: seguir `DATABASE_URL` owner + autorización en aplicación.
