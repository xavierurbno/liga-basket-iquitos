# Fase 1 — Auditoría rápida (acciones críticas)

Trazabilidad mínima sin tabla `audit_events`. La Fase 2 persistirá estos eventos en BD.

## Campos `registered_by` en BD

| Tabla / flujo | Campo | Estado Fase 1 |
|---------------|-------|-----------------|
| `treasury` — panel liga (`createTreasuryTransaction`) | `registered_by` | Rellenado |
| `treasury` — caja club (`registrarMovimientoAction`) | `registered_by` | Ya existía |
| `gallery_photos` | `registered_by` | Ya existía |
| `ownership_history` | `registered_by` | Ya existía |

## Eventos `security-log` (stdout / Vercel JSON)

| Tipo | Cuándo | Nivel |
|------|--------|-------|
| `auth.denied` | `requireAuth` / `withAuth` rechaza | warn |
| `auth.tenant.club_mismatch` | Scope club incorrecto | warn |
| `auth.tenant.league_mismatch` | Scope liga incorrecto | warn |
| `auth.route.forbidden` | Layout admin / intranet | warn |
| `auth.session.failure` | Sesión inválida | error |
| `rate_limit.blocked` | Proxy o `enforceRateLimit` (login, validar, busqueda365) | warn |
| `treasury.create` | Movimiento creado en tesorería liga | info |
| `player.create` | Jugador registrado en intranet | info |

Variables:

- `SECURITY_LOG_JSON=1` — JSON en local
- `SECURITY_LOG_LEVEL=info|warn|error` (default `warn`)
- En **producción/Vercel**, los eventos `info` (`treasury.create`, `player.create`) se emiten siempre en JSON aunque el nivel mínimo sea `warn`

## Pendiente Fase 2+

- `player.update`, `settings.update`, `tournament.*`, `normativa.upload`, `gallery.delete`
- Consultas PII (`validar.view`, `busqueda365.query`)
- Tabla `audit_events` + UI “Actividad”

## Verificación local

```bash
npm test
SECURITY_LOG_JSON=1 npm run dev
```

Tras crear un movimiento en tesorería o registrar un jugador, revisar consola por líneas JSON con `domain: "security"`.
