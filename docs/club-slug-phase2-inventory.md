# Fase 2 — Inventario slug compuesto `(league_id, slug)`

PR 2.1 · Pre-migración e inventario de código.

## Decisión de routing (Opción C)

| Área | Estrategia |
|------|------------|
| Delegado autenticado | `/{clubSlug}/...` — lookup por `club_id` en JWT (proxy), no por slug global |
| Portal público galería | `/galeria/club/{clubId}/` o `/l/{leagueSlug}/galeria/club/{clubId}/` |
| Rutas legacy `/{clubSlug}/` | `resolveClubBySlugForPortal` con cookie `active_league_slug` o `?l=` |
| Intranet | `/liga/clubs/{clubId}/...` (UUID, sin ambigüedad) |

## Pre-check SQL (ejecutar antes de 0039)

Archivo: `scripts/club-slug-collision-pre-check.sql`

```sql
-- Debe devolver 0 filas:
SELECT slug, league_id, COUNT(*) AS count
FROM public.clubs
GROUP BY slug, league_id
HAVING COUNT(*) > 1;

-- Informativo (mismo slug en ligas distintas será válido tras 0039):
SELECT slug, COUNT(*) AS count, array_agg(league_id::text) AS ligas
FROM public.clubs
GROUP BY slug
HAVING COUNT(*) > 1;
```

## Migración 0039

- `supabase/migrations/0039_clubs_league_slug_unique.sql`
- Rollback manual:

```sql
DROP INDEX IF EXISTS public.clubs_league_slug_idx;
CREATE UNIQUE INDEX clubs_slug_idx ON public.clubs (slug);
```

## Inventario `findBySlug` / `existsBySlug` (sin `leagueId`)

| Archivo | Estado Fase 2 |
|---------|----------------|
| `src/lib/routing/redirect-club-slug-legacy.ts` | ✅ `resolveClubBySlugForPortal` + cookie/`?l=` |
| `src/app/(dashboard)/[clubSlug]/page.tsx` | ✅ pasa `?l=` |
| `src/app/(dashboard)/[clubSlug]/[...rest]/page.tsx` | ✅ pasa `?l=` |
| `src/proxy.ts` | ✅ lookup por `club_id` + validación `league_id` JWT |
| `src/services/clubService.ts` | ✅ `existsBySlugAndLeague(slug, leagueId)` |
| `src/lib/actions/clubs.ts` | ✅ `existsBySlugAndLeague(slug, null)` (propietario sistema) |
| `src/lib/actions/ownership.ts` | ✅ `existsBySlugAndLeague` antes de insert |
| `src/repositories/clubRepository.ts` | ✅ métodos nuevos; legacy deprecado |

## Riesgos conocidos

1. **Clubes con `league_id` NULL:** PostgreSQL trata NULL como distinto en UNIQUE compuesto; varios clubes huérfanos podrían compartir slug. Mitigación: `existsBySlugAndLeague(slug, null)` solo en ámbito huérfano.
2. **Slug ambiguo en legacy sin cookie:** `findBySlugUnambiguous` devuelve null → 404; usar `?l=league-slug`.
3. **Ventana de migración:** aplicar 0039 en staging → prod en fin de semana tras pre-check limpio.

## Entregables

- [x] Migración 0039 en repo
- [x] Drizzle `clubs_league_slug_idx`
- [x] `findBySlugAndLeague` / `existsBySlugAndLeague`
- [x] Proxy reforzado
- [x] Doc URLs públicas (`docs/club-public-urls.md`)
- [x] 0039 aplicada en staging (DEV `txmnlszmumayyrisqeby`) y prod (`jfgnwtkmqayzhlwfxidz`) — ver `scripts/club-slug-0039.mjs`
