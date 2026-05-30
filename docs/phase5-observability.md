# Fase 5 — Observabilidad, DX y endurecimiento

## 5.1 React Strict Mode

- `next.config.ts`: `reactStrictMode: true`
- Efectos con fetch/intervalos usan bandera `cancelled` o `requestId` (p. ej. `MasterClockCounter`, `StaleSessionCleanup`, `Busqueda365Client`).

## 5.2 CI ampliado

Workflow `.github/workflows/ci.yml`:

| Job | Descripción |
|-----|-------------|
| `build` | manifest, audit app/db, `env:verify:strict`, tests, lint, build |
| `db-verify-local` | Postgres 16 + `db:bootstrap:dev` + `db:verify:dev` (opcional, `continue-on-error`) |
| `e2e` | Playwright si existen secretos `E2E_*` (opcional) |

## 5.3 Logging de seguridad

Módulo: `src/lib/observability/security-log.ts`

- Eventos JSON en stdout en producción/Vercel (`SECURITY_LOG_JSON=1` en local).
- Si existe `SENTRY_DSN` y el paquete `@sentry/nextjs` está instalado, envía `captureMessage` con tags.

Tipos: `auth.denied`, `auth.tenant.club_mismatch`, `auth.tenant.league_mismatch`, `auth.route.forbidden`, `auth.session.failure`.

Integrado en: `delegate-club-scope`, `assert-action-scope`, `resolveAuthSession`, layout `(admin)`.

**Datadog:** configurar el drain de logs de Vercel o el agente para parsear líneas JSON con `domain=security`.

## 5.4 Deploy — env estricto

- Script: `npm run env:verify:strict`
- Build Vercel: `npm run build:vercel` (definido en `vercel.json`)
- CI ejecuta `env:verify:strict` antes del build

## 5.5 Playwright (mínimo)

```bash
npm install
npx playwright install chromium

# .env.local o export:
# E2E_BASE_URL=http://localhost:3001
# E2E_DELEGATE_EMAIL=...
# E2E_DELEGATE_PASSWORD=...
# E2E_LEAGUE_SLUG=lddbi-iquitos
# E2E_FOREIGN_CLUB_ID=<uuid club ajeno>

npm run test:e2e
```

Specs: `e2e/login.spec.ts`, `e2e/intranet-club-scope.spec.ts`, `e2e/busqueda365-scoped.spec.ts`

Sin variables E2E, los tests se omiten (`test.skip`).
