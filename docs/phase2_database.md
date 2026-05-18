# Fase 2 — Base de datos (torneos + RLS operativo)

Proyecto Supabase vinculado: `jfgnwtkmqayzhlwfxidz` (ver `supabase/.temp/linked-project.json`).

## Estado aplicado (2026-05-17)

| Paso | Archivo | Resultado |
|------|---------|-----------|
| Torneos A–D | `supabase/APPLY_TOURNAMENTOS_COMPLETO.sql` | Ya existía en remoto |
| RLS operativo | `supabase/migrations/0017_rls_operational_league.sql` | **Aplicado** vía `npm run db:phase2 -- apply-rls` |

Verificación: las 12 comprobaciones de `supabase/VERIFY_PHASE2.sql` en **OK**.

## Comandos

Desde `liga-basket-iquitos/` (requiere `.env.local` con `DATABASE_URL` o `DATABASE_URL_POOLED`):

```bash
npm run db:phase2:verify          # solo comprobar
npm run db:phase2 -- apply-rls    # solo 0017
npm run db:phase2 -- apply-tournaments   # solo torneos (idempotente)
npm run db:phase2:apply           # torneos + 0017
```

El script `scripts/phase2-db.mjs` prueba pooler → direct → `DATABASE_URL` si el host `db.*.supabase.co` no resuelve en local.

## Orden en un entorno nuevo

1. Prerrequisitos Drizzle / migraciones base (`leagues`, `categories`, etc.).
2. `APPLY_TOURNAMENTOS_COMPLETO.sql`
3. `0017_rls_operational_league.sql`
4. `npm run db:phase2:verify`

## Nota sobre Drizzle

Las migraciones `0007`–`0017` no están en `supabase/migrations/meta/_journal.json`. En este proyecto la Fase 2 se aplica con los SQL anteriores, no con `drizzle-kit migrate`.
