# Roles de conexión Postgres (evaluación Fase 4.4)

## Situación actual

- Next.js / Drizzle usan `resolvePostgresConnectionString()` → `DATABASE_URL` / pooler con rol **postgres** o **service** (owner).
- **RLS no aplica** a conexiones owner: el aislamiento es `withAuth`, scopes (`leagueId`, `clubId`) y guards en actions.
- Supabase Auth (JWT + `app_metadata`) alimenta RLS solo para clientes que usan `supabase-js` con anon key + sesión usuario.

## Opciones evaluadas

### A. Rol limitado `DATABASE_URL_APP` (recomendado a medio plazo)

- Crear rol `liga_app` con `GRANT` mínimos en tablas `public` y **sin** `BYPASSRLS`.
- Drizzle en prod usaría esa URI; migraciones/bootstrap seguirían con owner en CI local.
- **Pros:** defensa en profundidad si alguien importa `db` sin scope.
- **Contras:** políticas RLS deben coincidir con reglas de `withAuth`; migraciones y seeds más complejos; Drizzle migrations suelen requerir owner.

### B. Middleware SQL `SET request.jwt.claims`

- Patrón Supabase: `SET LOCAL request.jwt.claims = '{"sub":"...","app_metadata":{...}}'` por request.
- Requiere pool por request o `SET` al inicio de cada transacción desde el JWT de la cookie.
- **Pros:** RLS útil para queries ad-hoc con rol limitado.
- **Contras:** no está integrado en postgres.js actual; frágil con pooling transaccional (PgBouncer).

### C. Mantener owner + scopes en app (estado actual)

- **Pros:** simple, ya auditado en Fase 2; sin sorpresas en bootstrap.
- **Contras:** un `db.select()` sin filtro en action/page filtra datos.

## Recomendación

1. **Corto plazo:** opción C + política repositories (`docs/DATA_LAYER.md`) + `npm run db:audit:access`.
2. **Cuando haya tráfico multi-liga en prod:** pilotar A en staging con `DATABASE_URL_APP` solo para lecturas públicas anonimizadas; escrituras siguen con scopes explícitos.
3. Opción B solo si se centraliza acceso SQL en un wrapper que abra transacción y setee claims — no mezclar con el singleton global actual.

## Variables de entorno (futuro)

```env
# Migraciones / bootstrap (owner)
DATABASE_URL_DIRECT=...

# Runtime Next (rol limitado, opcional)
# DATABASE_URL_APP=postgresql://liga_app:...@...:6543/postgres
```

`resolve-postgres-url.ts` puede extenderse con `DATABASE_RUNTIME_URL` que preferiría `DATABASE_URL_APP` en `NODE_ENV=production` sin romper dev local.
