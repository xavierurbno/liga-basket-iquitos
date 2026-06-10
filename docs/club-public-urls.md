# URLs públicas de club (Fase 2)

Referencia para enlaces del portal, galería y rutas legacy.

## Canónicas (recomendadas)

| Contexto | URL | Notas |
|----------|-----|-------|
| Galería club (multi-liga) | `/l/{leagueSlug}/galeria/club/{clubId}/` | Sin ambigüedad; preferida en portal |
| Galería club (fallback) | `/galeria/club/{clubId}/` | LDDBI / rutas sin slug de liga |
| Galería institucional | `/l/{leagueSlug}/galeria-institucional/` | Portal por liga |
| Portal liga | `/l/{leagueSlug}/` | Home pública |

Helpers: `src/lib/portal/league-portal-paths.ts`

```typescript
leaguePortalClubGallery(leagueSlug, clubId)
// → /l/{leagueSlug}/galeria/club/{clubId}/

leaguePortalInstitutionalGallery(leagueSlug)
// → /l/{leagueSlug}/galeria-institucional/
```

## Intranet (autenticado)

| Rol | URL base | Resolución |
|-----|----------|------------|
| Delegado | `/{clubSlug}/...` → redirige a `/liga/clubs/{clubId}/...` | Proxy usa `club_id` del JWT, no slug global |
| Admin liga | `/liga/clubs/{clubId}/...` | UUID explícito |

## Legacy `/{clubSlug}/`

Redirección vía `redirect-club-slug-legacy.ts`:

1. Query `?l={leagueSlug}` (prioridad)
2. Cookie `active_league_slug`
3. Un solo club con ese slug en BD → OK
4. Varios clubes con mismo slug → **404** (indicar liga)

Ejemplo: `/real/?l=lddbi-iquitos` → panel del club "Real" en LDDBI.

## Slug único por liga

Tras migración **0039**, `(league_id, slug)` es único. Dos ligas pueden tener club `"real"` sin colisión.

Validación al crear club:

- Wizard delegado / LEAGUE_ADMIN: `existsBySlugAndLeague(slug, leagueId)`
- Propietario sistema (sin liga): `existsBySlugAndLeague(slug, null)`

## Proxy (delegados)

El proxy valida que `clubs.league_id` coincida con `app_metadata.league_id` del JWT. Si no coincide → `/onboarding`.

No se usa lookup ambiguo por slug en rutas autenticadas de delegado.
