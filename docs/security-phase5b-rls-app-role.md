# Fase 5b — Segunda línea de defensa (DATABASE_URL_APP + RLS)

## Objetivo

Defensa en profundidad: Drizzle en runtime usa rol **`liga_app`** (sin `BYPASSRLS`) con políticas alineadas a `withAuth` + scopes en repositorio.

**Rollback:** `USE_APP_DB_ROLE=false` y `USE_APP_DB_ROLE_WRITES=false` → vuelve conexión owner vía env (sin redeploy de código).

## PR 5b.1 — Rol PostgreSQL

Migración `0042_liga_app_role.sql`:

- `CREATE ROLE liga_app` — `NOSUPERUSER`, `NOBYPASSRLS`
- `GRANT` en `public` (tablas + secuencias + default privileges)
- `GRANT authenticated TO liga_app` + `USAGE` en `auth` (políticas `TO authenticated` + `auth.jwt()`)
- **No** se otorga: `BYPASSRLS`, DDL, tablas `auth.*`

Provisionar contraseña (fuera del SQL):

```bash
LIGA_APP_DB_PASSWORD='...' node scripts/provision-liga-app-role.mjs --apply-migrations
```

## PR 5b.2 — Dual connection

| Export | Rol | Uso |
|--------|-----|-----|
| `dbOwner` | postgres/owner | Migraciones, seeds, scripts CI |
| `dbApp` | liga_app | Runtime con RLS |
| `db` | alias → `dbOwner` | Compatibilidad hasta migrar callers |
| `getOperationalDb(intent)` | según flags | `'read' \| 'write' \| 'owner'` |

Archivos:

- `src/lib/db/resolve-postgres-url.ts` — `resolvePostgresOwnerConnectionString`, `resolvePostgresAppConnectionString`
- `src/lib/db/client.ts`
- `src/lib/db/db-runtime-config.ts` — flags
- `src/lib/db/jwt-claims-for-rls.ts` + `with-rls-transaction.ts` — `set_config('request.jwt.claims', …)`

Variables:

```env
DATABASE_URL_APP=postgresql://liga_app:...@....pooler.supabase.com:6543/postgres
USE_APP_DB_ROLE=false          # lecturas con liga_app
USE_APP_DB_ROLE_WRITES=false   # escrituras con liga_app
```

`drizzle.config.ts` y `scripts/db-migrate.mjs` siguen con owner.

## PR 5b.3 — Auditoría tabla por tabla

Migración `0043_rls_core_drizzle_tables.sql` — RLS en tablas que Drizzle usaba sin políticas:

- `players`, `categories`, `league_settings`, `league_plans`, `player_documents`

Políticas existentes (0017, 0030, 0038): `clubs`, `sponsors`, `tournaments*`, `treasury`, `document_history`, `leagues`, etc.

Comandos:

```bash
npm run db:audit:rls      # matriz RLS vs tablas Drizzle
npm run db:smoke:rls-app  # liga_app sin JWT → 0 filas; con claims → acotado
```

### Matriz resumida (post-0043)

| Tabla | RLS | Filtro liga/club |
|-------|-----|------------------|
| players | ✓ | `user_can_access_league` / delegado `jwt_club_id` |
| categories | ✓ | idem |
| clubs | ✓ | 0017 |
| tournaments* | ✓ | 0017 |
| treasury | ✓ | 0030 |
| document_history | ✓ | 0038 |
| sponsors | ✓ | 0017 |
| league_settings | ✓ | 0043 |
| league_plans | ✓ | 0043 (write SUPER_ADMIN) |
| normativas | ✓ | 0020 |
| gallery_photos | ✓ | 0030 |
| audit_events | ✓ | 0031 |
| user_assignments | ✓ | 0030 |

Repositorios deben seguir filtrando por `leagueId`/`clubId` (Fase 1) aunque RLS falle.

## PR 5b.4 — Activación gradual

1. **Staging:** `USE_APP_DB_ROLE=true`, `DATABASE_URL_APP` configurada; smoke + E2E.
2. **Prod lecturas:** `USE_APP_DB_ROLE=true` en rutas no críticas que usen `getOperationalDb('read')`.
3. **Prod escrituras:** tras ~1 semana sin incidentes, `USE_APP_DB_ROLE_WRITES=true`.
4. Queries con RLS requieren `withRlsTransaction(user, context, fn)` cuando usen `dbApp`.

## Orden de despliegue BD

```bash
node scripts/apply-migration-0042.mjs
node scripts/apply-migration-0043.mjs
LIGA_APP_DB_PASSWORD='...' node scripts/provision-liga-app-role.mjs
npm run db:audit:rls
npm run db:smoke:rls-app
```

**Riesgo alto:** probar solo en staging antes de prod.
