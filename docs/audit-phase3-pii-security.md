# Fase 3 — Seguridad y PII

Objetivo: trazabilidad de consultas sensibles **sin** persistir DNI ni tokens completos en logs.

## Módulos

| Archivo | Rol |
|---------|-----|
| `src/lib/observability/pii-fingerprint.ts` | `docLast4`, `docHash`, `tokenHash`, `termHash` |
| `src/lib/observability/pii-access-log.ts` | Helpers que emiten eventos `pii.*` vía `security-log` |
| `src/lib/observability/security-log.ts` | Tipos ampliados + `logSensitiveRouteAllowed` |

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `PII_LOG_HASH_SALT` | Sal para hashes de documento/token/búsqueda (recomendado en prod) |
| `VALIDATION_TOKEN_SECRET` | Fallback de sal si no hay `PII_LOG_HASH_SALT` |
| `SECURITY_LOG_JSON=1` | JSON en local |
| `SECURITY_LOG_LEVEL=info` | Incluye eventos `pii.*` y `auth.route.allowed` en filtro local |
| `SENTRY_DSN` | Opcional: `@sentry/nextjs` recibe `warn`/`error` (no `info` PII por defecto) |

## Eventos PII (`domain: security`, nivel `info`)

| Tipo | Origen |
|------|--------|
| `pii.validar.view` | `app/validar/[id]/page.tsx` — outcome, `tokenHash`, `entityId` si aplica |
| `pii.busqueda365.query` | `busqueda365.ts` — liga, categoría, `searchTermHash` |
| `pii.document.search` | `buscarJugadorPorDocumento`, `buscarClubParaDocumento` — `docLast4`/`docHash` o hash de query |

**Nunca** se registran: número de documento completo, snapshot PDF, email en payloads de log.

## Accesos exitosos a rutas sensibles

`auth.route.allowed` en `proxy.ts` cuando un usuario autenticado entra a:

- `/super-admin`
- `/liga/documentos`
- `/liga/tesoreria`

Complementa los eventos de denegación (`auth.route.forbidden`, `auth.denied`, etc.).

## Retención recomendada

| Destino | Retención sugerida | Notas |
|---------|-------------------|--------|
| Logs stdout / Vercel (`security`, `pii.*`) | **90 días** | Configurar en drain (Datadog, Logtail, etc.) |
| Tabla `audit_events` (Fase 2) | **1 año** | Job mensual: `npm run ops:purge:audit-events`, Vercel Cron `/api/cron/purge-audit`, pg_cron (`0045`) |
| Sentry (opcional) | Según plan Sentry | Solo `warn`/`error` de seguridad, no consultas PII `info` |

Implementación: `src/lib/observability/purge-audit-events.ts`, `docs/security-phase3-ley29733-maintenance.md`.

Ejemplo de purga anual (ejecutar con rol postgres, fuera de horario pico):

```sql
DELETE FROM public.audit_events
WHERE created_at < now() - interval '1 year';
```

## Consulta rápida (logs Vercel / JSON)

Filtrar líneas con `"type":"pii.validar.view"` o `"type":"pii.document.search"`.

Correlacionar abuso por `meta.clientIp` o `meta.docHash` repetido.

## Pendiente Fase 4

- UI intranet «Actividad reciente» leyendo `audit_events`
- Más acciones en `recordAudit` (`player.update`, torneos, normativas)
