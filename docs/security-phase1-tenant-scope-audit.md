# Fase 1 — Barrido de server actions (tenant scope)

Actualizado tras implementación de guards centralizados.

## Guards centrales

| Módulo | Función |
|--------|---------|
| `assert-league-scope.ts` | `assertOperationalLeagueMatch`, `resolveClientLeagueId` |
| `extract-league-id-from-args.ts` | Extrae `leagueId` de FormData/args |
| `assert-action-scope.ts` | `checkLeagueIdFromArgsScope` en `evaluateActionTenantScope` |
| `system-dashboard-helpers.ts` | `assertClubInOperationalScope` |

## Actions auditadas

| Archivo | `leagueId` cliente | Guard aplicado | Estado |
|---------|-------------------|----------------|--------|
| `sponsors.ts` | FormData / metadata | `resolveClientLeagueId` + `assertOperationalLeagueMatch` + ownership | ✅ Fase 1 |
| `clubs.actions.ts` | `clubId` | `assertClubInOperationalScope` + `findByIdAndClub` | ✅ Fase 1 |
| `settings.ts` | FormData | `assertOperationalLeagueMatch` | ✅ Fase 1 |
| `settings.actions.ts` | query param público | Solo campos `PublicLeagueSettings` + rate limit | ✅ Fase 1 |
| `gallery.ts` | vía club/resolver | `assertOperationalLeagueMatch` post-resolución | ✅ Fase 1 |
| `institutional-assets-access.ts` | param `leagueId` | `assertOperationalLeagueMatch` staff sin liga bloqueado | ✅ Fase 1 |
| `normativas-admin.ts` | FormData | `resolveNormativaUploadLeagueId` + check LEAGUE_ADMIN | ✅ Preexistente + `evaluateActionTenantScope` |
| `profile.actions.ts` | FormData | Checks por rol y liga en action | ✅ Preexistente (revisado) |
| `tournaments.ts` | — | Solo `context.leagueId` | ✅ OK |
| `players.actions.ts` | — | `resolveLeagueAndClubForPlayerAction` | ✅ OK |
| `assets.ts` | param | `assertInstitutionalAssetsForLeague` | ✅ Mejorado Fase 1 |
| `leagues.ts` | FormData | Solo `SUPER_ADMIN` | ✅ OK |
| `documentHistory.ts` | — | `document-emission-scope` | ✅ OK |
| `busqueda365.ts` | param público | Rate limit + filtro SQL por liga | ✅ Intencional |
| `normativas-documents.ts` | UUID público | `esPublico` + allowlist URL | ✅ Intencional |

## Tests

- `assert-league-scope.test.ts`
- `extract-league-id-from-args.test.ts` (incluye `checkLeagueIdFromArgsScope`)

## Smoke test LDDBI (manual)

- [ ] Login LEAGUE_ADMIN → editar categoría propia
- [ ] Login CLUB_DELEGATE → eliminar categoría del club (no ajena)
- [ ] Patrocinadores: upsert/delete en liga activa
- [ ] Reloj mercado de pases en portal `/` y `/l/iquitos/`
- [ ] Configuración liga `/liga/configuracion`
