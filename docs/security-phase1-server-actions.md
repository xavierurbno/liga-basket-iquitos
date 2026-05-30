# Fase 1 seguridad — inventario de server actions

Actualizado con el cierre de Fase 1 (carnet, validación pública, assets).

## Protegidas (sesión + rol)

| Action / módulo | Mecanismo |
|-----------------|-----------|
| `assets.ts` — logos y carnet institucional | `requireAuth` + `assertInstitutionalAssetsForLeague` |
| `validation-url.ts` — URL QR | `requireAuth` + scope jugador/categoría |
| `system-dashboard.ts` | `withAuth` |
| `buscarJugadorPorDocumento` | `withAuth` (SUPER_ADMIN, LEAGUE_ADMIN) |
| `buscarClubParaDocumento` | `requireAuth` |
| `documentHistory.ts` | `requireAuth` |
| `gallery.ts`, `tournaments.ts`, `sponsors.ts` | `withAuth` |
| `profile.actions.ts`, `leagues.ts`, `settings.ts` | `withAuth` / auth propio |
| `normativas-admin.ts`, `club.actions.ts` | auth |
| `treasury.ts` | `getUser` + `resolveTreasuryAccess` |
| `clubs.ts` — upload / crear propietario | sesión + owner / system owner |
| `ownership.ts` | `requireUser` (revisar en Fase 2) |

## Públicas intencionales

| Action | Notas |
|--------|-------|
| `busqueda365.ts` | Sin DNI; datos de plantilla pública |
| `normativas-documents.ts` | Solo `esPublico = true` |
| `auth.ts` | Login / OAuth |

## Rutas RSC públicas sensibles

| Ruta | Fase 1 |
|------|--------|
| `/validar/[id]` | Sin DNI; token firmado `v1.*` + compat UUID legado |

## Pendiente Fase 2+

- `ownership.createClubAsDelegateAction` — solo `CLUB_DELEGATE` con liga asignada
- Unificar tesorería / `club_members` vs JWT
- Rate limiting login y `/validar`
