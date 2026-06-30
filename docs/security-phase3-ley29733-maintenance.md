# Fase 3 (Ley 29733) — ARCO, retención y mantenimiento

Tareas BLQ-5.4, BLQ-5.2, BLQ-4.4 y sanitización de `document_history`.

## BLQ-5.4 — Flujo ARCO (staff)

| Componente | Ubicación |
| --- | --- |
| Exportación (acceso) | `exportPlayerArcoAction` → `src/lib/actions/player-arco.actions.ts` |
| Anonimización (cancelación) | `anonymizePlayerArcoAction` |
| Lógica de dominio | `src/lib/privacy/player-arco.ts` |
| UI intranet | `PlayerArcoActions` en categoría del club (solo `LEAGUE_ADMIN` / `SUPER_ADMIN`) |
| SLA documentado | `content/legal/privacidad.md` §13.3 (15 días calendario) |

Roles autorizados: `SUPER_ADMIN`, `LEAGUE_ADMIN`. Los delegados deben canalizar solicitudes vía WhatsApp o administrador de liga.

Auditoría: `player.arco.export`, `player.arco.anonymize` en `audit_events`.

## BLQ-5.2 — Purga `audit_events`

| Mecanismo | Cuándo |
| --- | --- |
| **pg_cron** (Supabase) | `0045_audit_events_retention_pg_cron.sql` — día 1 de cada mes, 04:00 UTC |
| **Vercel Cron** | `GET /api/cron/purge-audit` — requiere `CRON_SECRET` |
| **Script manual** | `npm run ops:purge:audit-events` (`--dry-run` opcional) |

Retención default: **1 año** (`AUDIT_EVENTS_RETENTION_YEARS`).

Logs Vercel (`security`, `pii.*`): retención recomendada **90 días** en drain del proveedor (`VERCEL_LOG_RETENTION_DAYS` documental).

## BLQ-4.4 — Auditoría de plan manual

`updateLeaguePlanAction` registra `league_plan.update` con plan y límites antes/después.

## Extra — `document_history.snapshot`

Nuevas emisiones guardan snapshot **sin PII** (`sanitizeDocumentHistorySnapshot`). La anonimización ARCO depura filas históricas del jugador.

## Despliegue

1. Aplicar migración `0045` en Supabase (SQL Editor o bootstrap).
2. Configurar `CRON_SECRET` en Vercel Production (Cron lo envía como `Authorization: Bearer`).
3. Configurar retención 90 días en drain de logs Vercel.
4. Verificar: `npm run ops:purge:audit-events -- --dry-run`

## Tests

```bash
npm test
# incluye document-history-snapshot.test.ts y record-audit (acciones ARCO)
```
