# Fase 2 — Auditoría persistente (`audit_events`)

## Migración

Ejecutar en Supabase SQL Editor (producción) o `npm run db:bootstrap:dev` (local):

`supabase/migrations/0031_audit_events.sql`

## Tabla `public.audit_events`

| Columna | Uso |
|---------|-----|
| `actor_id` | Usuario que ejecutó la acción |
| `actor_role` | Rol JWT al momento del evento |
| `action` | Código (`treasury.create`, `player.create`, …) |
| `entity_type` / `entity_id` | Recurso afectado |
| `league_id` / `club_id` | Alcance tenant |
| `client_ip` | IP del request (si disponible) |
| `payload` | JSON sin PII (sin DNI, snapshot completo, etc.) |

## RLS (lectura vía API)

- **SUPER_ADMIN:** todas las filas
- **LEAGUE_ADMIN / delegado con liga operativa:** filas de su `league_id`
- **CLUB_DELEGATE:** filas de su `club_id`

La escritura la hace el servidor (Drizzle / rol postgres), no PostgREST.

## Código

- Helper: `src/lib/observability/record-audit.ts`
- Integrado en: `treasury.ts`, `clubs.actions` (caja), `players.actions`, `settings.ts`, `ownership.ts`, `documentHistory.ts`
- Tests: `src/lib/observability/record-audit.test.ts` (añadir a `npm test` si se desea en CI)

## Consulta rápida (SQL)

```sql
SELECT created_at, actor_role, action, entity_type, entity_id, league_id, club_id, payload
FROM public.audit_events
ORDER BY created_at DESC
LIMIT 50;
```

## Fase 3 (implementada)

Logs PII y accesos permitidos — ver `docs/audit-phase3-pii-security.md`.

## Pendiente Fase 4

- UI intranet “Actividad reciente”
- Más acciones (`player.update`, torneos, normativas)
