# Entornos DEV y PROD — Liga Basket Iquitos

Dos proyectos Supabase independientes. El código es el mismo; cambian las variables de entorno.

| | DEV | PROD |
|---|-----|------|
| Proyecto | `liga-iquitos-dev` | XavierUrbano's Project |
| Ref | `txmnlszmumayyrisqeby` | `jfgnwtkmqayzhlwfxidz` |
| Local | `.env.local` | — |
| Vercel Production | — | variables PROD |
| Vercel Preview | variables DEV (recomendado) | — |

## Configuración local (DEV)

1. Copia `.env.example` → `.env.local`
2. Rellena keys de **liga-iquitos-dev** (Settings → API, Database → Connect)
3. Verifica:

```bash
npm run env:verify
```

4. Bootstrap de BD vacía:

```bash
npm run db:bootstrap:dev
npm run db:verify:dev
```

5. Reinicia dev:

```bash
npm run dev
```

## Scripts de base de datos

| Comando | Uso |
|---------|-----|
| `npm run db:generate` | Genera SQL desde `schema.ts` (sin conectar) |
| `npm run db:bootstrap:dev` | Aplica todas las migraciones SQL en DEV (BD vacía) |
| `npm run db:migrate:dev` | Drizzle migrate incremental (tras `db:generate`) |
| `npm run db:verify:dev` | Comprueba ref DEV y tablas mínimas |
| `npm run db:bootstrap:prod` | Bloqueado salvo confirmación explícita |
| `npm run db:migrate:prod` | Bloqueado salvo confirmación explícita |

### Guardia anti-prod

Los scripts `db:*` detectan el ref `jfgnwtkmqayzhlwfxidz` y **abortan** salvo:

```bash
CONFIRM_PROD_MIGRATE=yes npm run db:bootstrap:prod -- --force-prod
```

**Recomendado para prod:** Supabase Dashboard → SQL Editor (manual), no desde PC.

## Upstash Redis (rate limit distribuido)

Integración instalada: **Upstash for Redis** (`upstash-kv-chestnut-desert`).

Vercel inyecta en **Production, Preview y Development**:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

El código también acepta `UPSTASH_REDIS_REST_*` (alias opcionales).

Verificación:

```bash
npm run ops:verify:upstash
```

**Importante:** al conectar la integración, `vercel integration add` puede **sobrescribir** `.env.local` con solo variables de Vercel Development. Si pierdes `DATABASE_URL` / Supabase DEV, restaura desde `.env.example` + credenciales de `liga-iquitos-dev` y conserva las líneas `KV_*`.

## Vercel

### Production

Todas las variables con ref **jfgnwtkmqayzhlwfxidz** (prod actual).

```
APP_ENV=production
SUPABASE_PROJECT_REF=jfgnwtkmqayzhlwfxidz
DATABASE_POOL_MAX=2
```

### Preview

Duplicar variables **DEV** (`txmnlszmumayyrisqeby`) para que PRs no toquen datos reales.

## Auth (cada proyecto por separado)

| | DEV | PROD |
|---|-----|------|
| Site URL | `http://localhost:3001/` | `https://liga-basket-iquitos.vercel.app/` |
| Redirects | localhost callback | dominio prod callback |
| Google OAuth | opcional | configurado |

## Storage

Mismos nombres de bucket en ambos proyectos (`club-assets`, `jugador-fotos`, etc.). El aislamiento es por proyecto Supabase.

## Flujo diario

```
1. Código en local (.env.local = DEV)
2. npm run db:generate (si cambias schema.ts)
3. npm run db:migrate:dev o db:bootstrap:dev
4. npm test && npm run dev
5. git push → Vercel Preview (DEV) o Production (PROD)
6. Si hay SQL nuevo → aplicar en PROD (SQL Editor) antes/después del deploy
```

## Backup `.env.local` prod

Antes de cambiar a DEV:

```powershell
Copy-Item .env.local .env.local.backup-prod
```

Para volver temporalmente a prod local, restaura el backup.

## Secretos distintos

| Variable | DEV | PROD |
|----------|-----|------|
| `VALIDATION_TOKEN_SECRET` | Secreto A | Secreto B |
| `SUPABASE_SERVICE_ROLE_KEY` | Key dev | Key prod |

QR/tokens de dev no deben validar en prod.
