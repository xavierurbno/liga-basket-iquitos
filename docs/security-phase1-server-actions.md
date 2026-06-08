# Seguridad — server actions y rutas públicas

Actualizado tras Fases 1–5 (aislamiento documental, validación QR, multi-liga, rate limits).

## Protegidas (sesión + rol)

| Action / módulo | Mecanismo |
|-----------------|-----------|
| `assets.ts` — logos y carnet institucional | `requireAuth` + `assertInstitutionalAssetsForLeague` |
| `validation-url.ts` — URL QR | `requireAuth` + scope jugador/categoría |
| `system-dashboard.ts` | `withAuth` |
| `buscarJugadorPorDocumento` | `withAuth` + scope por liga + rate limit `documentos` |
| `getLeagueSettingsAction` / transferencias | Scope por `leagueId` (portal, cookie activa o default) |
| `normativas-documents.ts` | Público + UUID + allowlist URL + rate limit `normativas` |
| `buscarClubParaDocumento` | `requireAuth` + scope por liga + rate limit `documentos` |
| `documentHistory.ts` | `requireAuth` + scope emisión + rate limit `documentos` |
| `gallery.ts`, `tournaments.ts`, `sponsors.ts` | `withAuth` |
| `profile.actions.ts`, `leagues.ts`, `settings.ts` | `withAuth` / auth propio |
| `normativas-admin.ts`, `club.actions.ts` | auth |
| `treasury.ts` | `getUser` + `resolveTreasuryAccess` |
| `clubs.ts` — upload / crear propietario | sesión + owner / system owner |

## Públicas intencionales

| Action | Notas |
|--------|-------|
| `busqueda365.ts` | Sin DNI; rate limit `busqueda365` |
| `normativas-documents.ts` | Solo `esPublico = true` |
| `auth.ts` | Login / OAuth; rate limit `login` |
| `getCarnetInstitutionalAssetsPublicAction` | Token QR `v1.*` obligatorio; rate limit `validarAssets`; sin URLs crudas |

## Rutas RSC públicas sensibles

| Ruta | Comportamiento |
|------|----------------|
| `/validar/[id]` | Token firmado `v1.*` obligatorio (UUID legado retirado) |
| `/normativas` | Redirige a `/l/[slug]/normativas/` (liga portal por defecto) |

## Rate limits (`src/lib/security/rate-limit.ts`)

| Scope | Límite |
|-------|--------|
| `login` | 5 / min |
| `validar` | 20 / min |
| `validarAssets` | 10 / min |
| `documentos` | 30 / min |
| `normativas` | 20 / min |
| `busqueda365` | 40 / min |

## Multi-liga (Fases 3–5)

- Serial documental por liga: `league_settings.document_serial_prefix` (migración `0037`).
- Wizard de alta: tipo `federated` vs `tournament` con defaults distintos.
- Carnet: colores desde `portalPrimaryColor` / `portalAccentColor`.
- Emisión documental: QR solo con URL firmada; reimpresión bloqueada si QR legado.
- `document_history.league_id`: rellenado en emisión; filas antiguas pueden ser `null` (solo historial).

## Roadmap (no implementado)

- `ownership.createClubAsDelegateAction` — endurecer scope delegado
- RLS profundo / `DATABASE_URL_APP` dedicada
- Unificar tesorería / `club_members` vs JWT
