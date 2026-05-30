# Capa de datos — política Drizzle y repositories

## Regla (Fase 4.3)

| Capa | Puede importar `db` / `@/lib/db/client` | Acceso a Postgres |
|------|-------------------------------------------|-------------------|
| `src/repositories/*` | Sí | Lecturas/escrituras de dominio |
| `src/lib/actions/*`, `src/actions/*` | Sí (vía repos preferido) | Mutaciones con `withAuth` / scopes |
| `src/lib/**` (servicios, auth, torneos) | Con criterio | Lógica compartida |
| `src/app/**` (pages, layouts) | **No** (objetivo) | Solo `repositories` o loaders en `src/lib/loaders/` |

El cliente Drizzle usa rol **owner** (bypass RLS). La seguridad multi-tenant sigue en `withAuth`, scopes y validación en servidor — no confiar en RLS para el runtime de Next.js.

## Repositories existentes

- `league.repository.ts`, `clubRepository.ts`, `categoryRepository.ts`, `playerRepository.ts`
- `settingsRepository.ts`, `photoRepository.ts`, `sponsorRepository.ts`, `normativaRepository.ts`
- `userAssignmentRepository.ts`

## Loaders (`src/lib/loaders/`)

- `club-page.loader.ts` — tenant club, galería, onboarding delegado
- `category-page.loader.ts` — detalle categoría, ficha, carnet, alta jugador
- `validation.loader.ts` — página pública `/validar/[id]`
- `perfiles.loader.ts` — hub de perfiles intranet

Auditoría: `npm run db:audit:access` (debe pasar sin violaciones en `src/app/`).

## Nuevas features

1. Añadir método en repository (o loader fino que solo llame al repo).
2. Server Action llama al repo; no duplicar SQL en la action.
3. Page llama action o loader; nunca `db` en `app/`.

## Bootstrap y migraciones

Ver `docs/phase4-database-migrations.md`.
