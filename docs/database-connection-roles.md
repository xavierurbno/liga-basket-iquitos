# Roles de conexión Postgres (Fase 5b implementada)

## Situación actual

- **Owner:** `dbOwner` / `resolvePostgresOwnerConnectionString()` — migraciones, seeds, `export const db` (compat).
- **App:** `dbApp` / `DATABASE_URL_APP` — rol `liga_app`, RLS efectivo.
- **Runtime gradual:** `getOperationalDb('read'|'write'|'owner')` + flags `USE_APP_DB_ROLE*`.
- Supabase Auth (JWT) + `withRlsTransaction()` alimentan `auth.jwt()` en sesiones `liga_app`.

Documentación completa: `docs/security-phase5b-rls-app-role.md`.

## Rollback

```env
USE_APP_DB_ROLE=false
USE_APP_DB_ROLE_WRITES=false
```

Sin cambiar código; Drizzle vuelve a owner vía env.

## Historial (evaluación Fase 4.4)

- Opción C (owner + scopes) fue la base Fases 1–5a.
- Opción A (`liga_app`) activa en Fase 5b con activación gradual en prod.
