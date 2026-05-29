# Fase 4 seguridad — defensa en profundidad

Endurecimiento contra fuerza bruta, scraping y vectores web genéricos. Complementa las fases 1–3 (datos sensibles, autorización, consistencia).

## Cambios en código

| Área | Cambio |
|------|--------|
| `rate-limit.ts` | Límites por IP en memoria (login, validar, búsqueda 365) |
| `proxy.ts` | HTTP 429 en rutas públicas sensibles |
| `auth.ts` | Rate limit en login; whitelist OAuth en servidor |
| `LoginForm.tsx` | Callback Google solo en hosts permitidos |
| `busqueda365.ts` | Rate limit en server actions |
| `content-security-policy.ts` | CSP, Permissions-Policy, HSTS (prod) |
| `next.config.ts` | Cabeceras de seguridad globales |

## Límites por defecto

| Scope | Límite | Ventana |
|-------|--------|---------|
| `login` | 10 intentos | 15 min |
| `validar` | 60 vistas | 10 min |
| `busqueda365` | 40 consultas | 1 min |

Desactivar en local (solo desarrollo): `SECURITY_RATE_LIMIT_DISABLED=true`

## OAuth — hosts permitidos

Se aceptan callbacks cuyo host esté en:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `VERCEL_URL` / `VERCEL_BRANCH_URL`
- `AUTH_ALLOWED_REDIRECT_HOSTS` (lista extra separada por comas)
- `localhost` / `127.0.0.1` (HTTP o HTTPS)

También deben coincidir con **Redirect URLs** en Supabase → Authentication.

## Cabeceras HTTP

- **CSP:** restrictiva pero compatible con Next.js (`unsafe-inline` en scripts/styles de runtime).
- **Permissions-Policy:** cámara, micrófono, geolocalización deshabilitados.
- **HSTS:** solo en `NODE_ENV=production`.

## Checklist RLS + Drizzle (PRs)

Drizzle usa credencial de servidor → **no aplica RLS**. En cada PR que toque datos:

- [ ] Server actions nuevas usan `withAuth` / `requireAuth` o justificación explícita de endpoint público.
- [ ] Consultas filtran por `league_id` / `club_id` cuando el rol no es `SUPER_ADMIN`.
- [ ] Migraciones SQL incluyen políticas RLS si la tabla es accesible vía PostgREST/anon.
- [ ] Tests unitarios cubren guards de lectura pública (`public-read-guards`, tokens, rate limit).
- [ ] No exponer DNI ni PII en rutas públicas (`/validar`, búsqueda 365).

Plantilla de PR: `.github/pull_request_template.md`

## MFA (operación — Supabase Dashboard)

No se activa desde código. Pasos manuales:

1. Supabase → **Authentication → Providers → Email** → habilitar MFA (TOTP) si está disponible en el plan.
2. Cuentas prioritarias: `MASTER_SUPER_ADMIN_EMAIL`, correos en `DASHBOARD_ADMIN_EMAILS`, `SYSTEM_OWNER_EMAILS`.
3. Documentar recovery codes fuera del repositorio.
4. Tras activar MFA, probar login intranet y OAuth Google.

## Vercel Firewall (recomendado)

El rate limit en memoria es **por instancia**. Para producción:

1. Vercel → Project → **Firewall** → rate limiting en `/login`, `/validar/*`, `/busqueda-365`.
2. Opcional: Upstash Redis + `@upstash/ratelimit` si se necesita límite global estricto.

## Verificación

```bash
npm test
npm run build
```

### Manual

1. 11+ intentos de login fallidos → mensaje de límite / HTTP 429 en `/login`.
2. OAuth desde dominio no listado → error antes de redirigir a Google.
3. DevTools → Network → respuesta incluye `Content-Security-Policy`.
4. Búsqueda 365: muchas consultas seguidas → error de rate limit.

## Pendiente fuera de código (Fase 4)

| Ítem | Estado | Acción |
|------|--------|--------|
| MFA en cuentas maestras | Manual | Supabase Dashboard |
| Vercel Firewall global | Manual | Panel Vercel |
| Upstash rate limit distribuido | Opcional | Si el tráfico crece |
| BD dev separada de prod | Operación | Nuevo proyecto Supabase |
| CSP `report-uri` / Reporting API | Opcional | Monitoreo de violaciones |
| Auditoría periódica de `"use server"` sin auth | Continuo | Revisión trimestral |
