# Despliegue en Vercel — Liga Basket Iquitos

## 1. Configuración del proyecto

| Campo | Valor |
|--------|--------|
| **Root Directory** | `liga-basket-iquitos` |
| **Framework** | Next.js (detección automática) |
| **Build Command** | `npm run build:vercel` (incluye `env:verify:strict`) |
| **Install Command** | `npm ci` (o `npm install`) |

El repositorio puede estar un nivel arriba; Vercel debe apuntar a la carpeta que contiene `package.json`.

## 2. Variables de entorno (Production)

Copia desde `.env.example` y rellena en **Project Settings → Environment Variables**.

### Obligatorias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (cadena del pooler de Supabase, modo transaction)
- `MASTER_SUPER_ADMIN_EMAIL` — correo del super administrador maestro (sin fallback en producción)

### Recomendadas

- `DATABASE_POOL_MAX=2` — limita conexiones simultáneas por instancia serverless (**añadir en Vercel si falta**)
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` — enlaces públicos, PDFs, portal
- `SYSTEM_OWNER_EMAILS` — correos con permiso para crear clubes (comas)
- Buckets: `NEXT_PUBLIC_BUCKET_ASSETS`, `NEXT_PUBLIC_BUCKET_PLAYERS`, `NEXT_PUBLIC_BUCKET_GALLERY`, `NEXT_PUBLIC_BUCKET_RECEIPTS`

Verificación: `npm run env:verify` — detalle en `docs/phase3_environment.md` y `docs/environments-dev-prod.md`.

### Supabase Edge Functions (no en Vercel)

- `PROCESS_PLAYER_IMAGE_WEBHOOK_SECRET` — ver `docs/deployment_edge_function.md`
- `BUCKET_PLAYERS=jugador-fotos`

## 3. Base de datos

1. Aplicar migraciones Drizzle / SQL en Supabase (`supabase/migrations`, `APPLY_TOURNAMENTOS_COMPLETO.sql` si aplica).
2. Verificar RLS y políticas en tablas sensibles.
3. Usar el **pooler** (puerto 6543) en `DATABASE_URL` para serverless.

## 4. CI (GitHub Actions)

El workflow `.github/workflows/ci.yml` ejecuta en cada push/PR a `main` o `master`:

1. `npm run db:validate:manifest` y `npm run db:audit:access`
2. `npm run env:verify:strict`
3. `npm test` — tests unitarios
4. `npm run lint`
5. `npm run build`
6. (Opcional) `db-verify-local` — Postgres + bootstrap + verify
7. (Opcional) `e2e` — Playwright con secretos `E2E_*`

Ver `docs/phase5-observability.md`.

Si el repositorio Git está en la carpeta padre, mueve el workflow o ajusta `working-directory` en el YAML.

## 5. Checklist pre-deploy

- [ ] `npm run build` sin errores en local
- [ ] `npm test` en verde
- [ ] `npm run env:verify:strict` sin errores (mismo check que el build en Vercel)
- [ ] `MASTER_SUPER_ADMIN_EMAIL` definido en Production
- [ ] `DATABASE_POOL_MAX=2` en Production
- [ ] Dominio y redirects de Supabase Auth (`docs/phase3_environment.md`, `supabase/AUTH_REDIRECT_URLS.template.txt`)
- [ ] Edge Function `process-player-image` desplegada con webhook secret
- [ ] Probar `/`, `/torneos/...`, `/liga/` y login

## 6. Tras el deploy

- Revisar **Vercel → Logs** en la primera carga del portal (timeouts de BD).
- Probar torneo público y tabla de posiciones.
- Confirmar que rutas `/super-admin/*` redirigen si no hay sesión SUPER_ADMIN.

## 7. Problemas frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Página en blanco / “Rendering…” largo | Pool saturado o Supabase lento | Bajar `DATABASE_POOL_MAX`, revisar pooler |
| Login OK pero no entra a `/liga` | Rol JWT o `MASTER_SUPER_ADMIN_EMAIL` | Revisar `app_metadata.role` y variable en Vercel |
| Patrocinadores vacíos en portal | `leagueId` inválido | UUID correcto en cookie/contexto del portal |
| Webhook de imágenes 401 | Falta secret en función | `supabase secrets set PROCESS_PLAYER_IMAGE_WEBHOOK_SECRET=...` |
