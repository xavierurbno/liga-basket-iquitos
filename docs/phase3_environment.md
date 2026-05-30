# Fase 3 — Variables de entorno y Auth (Vercel + Supabase)

> **Dos proyectos Supabase:** ver `docs/environments-dev-prod.md`  
> DEV `txmnlszmumayyrisqeby` · PROD `jfgnwtkmqayzhlwfxidz`

Proyecto Supabase PROD: `jfgnwtkmqayzhlwfxidz`  
Dashboard Auth PROD: https://supabase.com/dashboard/project/jfgnwtkmqayzhlwfxidz/auth/url-configuration

## 1. Vercel — comprobar / añadir

**Root Directory:** `liga-basket-iquitos`

### Ya configuradas (según revisión)

Las 15 variables sensibles en Production + Preview cubren el núcleo de la app.

### Añadir si falta

| Variable | Valor | Entornos |
|----------|-------|----------|
| `DATABASE_POOL_MAX` | `2` | Production, Preview |

### Validar valores (no solo nombres)

| Variable | Debe ser |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jfgnwtkmqayzhlwfxidz.supabase.co` |
| `DATABASE_URL` | URI del **pooler** (`*.pooler.supabase.com`, puerto **6543**) |
| `MASTER_SUPER_ADMIN_EMAIL` | Correo real del super admin (minúsculas) |
| `NEXT_PUBLIC_SITE_URL` | URL pública de producción (sin barra final o consistente) |
| `NEXT_PUBLIC_APP_URL` | Igual que SITE o dominio canónico |
| Buckets `NEXT_PUBLIC_BUCKET_*` | Nombres exactos de buckets en Storage |

`DATABASE_URL` tiene prioridad sobre `DATABASE_URL_POOLED` / `DATABASE_URL_DIRECT` en runtime.

## 2. Supabase Auth — URL Configuration

En **Authentication → URL Configuration**:

### Site URL

```
https://<TU_DOMINIO_PRODUCCION>/
```

Ejemplo: `https://liga-basket-iquitos.vercel.app/`

### Redirect URLs (añadir todas)

```
https://<TU_DOMINIO>/auth/callback
https://<TU_DOMINIO>/auth/callback/
https://<TU_DOMINIO>/
https://<TU_DOMINIO>/login/
```

### Preview (deploys de rama)

```
https://<proyecto>-<equipo>.vercel.app/auth/callback/
```

O patrón comodín si tu plan lo permite:

```
https://*-*.vercel.app/auth/callback/**
```

Google OAuth usa `redirectTo: ${origin}/auth/callback/?next=...` desde el navegador (`LoginForm.tsx`).

## 3. Verificación local

```bash
npm run env:phase3:verify
```

Carga `.env.local`, lista faltantes y imprime Redirect URLs sugeridas **sin** mostrar secretos.

### Portal público (`/`) — timeouts locales

Si aparece «No pudimos cargar el contenido de la liga» con `QueryTimeoutError` pero `DATABASE_URL` ya apunta al **pooler (6543)**:

1. **Reinicia** `npm run dev` para recrear el pool de Postgres.
2. Opcional en `.env.local`: `NEXT_PUBLIC_DEFAULT_LEAGUE_ID=<uuid>` (ID de tu liga en Supabase SQL o tabla `leagues`) para que portal y footer tengan fallback si la consulta llega tarde.

En desarrollo el código usa **al menos 10 conexiones** contra Supabase aunque `DATABASE_POOL_MAX=2`; en Production se respeta tu valor (típicamente `2`).

Los avisos `refresh_token_not_found` en consola son **cookies de sesión viejas**: cierra sesión o borra cookies del sitio; no afectan al portal público.

## 4. Tras configurar Vercel

1. **Redeploy** Production (o “Redeploy” último deployment) para cargar nuevas variables.
2. Probar: `/login/` → contraseña → `/liga/`
3. Probar: Google OAuth → vuelta a `/auth/callback/`
4. Probar: `/torneos/...` público

## 5. No va en Vercel

| Secret | Dónde |
|--------|--------|
| `PROCESS_PLAYER_IMAGE_WEBHOOK_SECRET` | Supabase Edge Function secrets |
| `BUCKET_PLAYERS` (nombre en función) | Supabase secrets |

Ver `docs/deployment_edge_function.md`.

## 6. Checklist Fase 3

- [ ] `DATABASE_POOL_MAX=2` en Vercel
- [ ] `DATABASE_URL` = pooler (6543)
- [ ] Site URL + Redirect URLs en Supabase Auth
- [ ] `npm run env:phase3:verify` sin errores en local
- [ ] Redeploy Vercel Production
- [ ] Smoke: login, `/liga/`, torneo público
