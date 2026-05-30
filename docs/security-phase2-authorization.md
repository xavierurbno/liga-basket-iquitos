# Fase 2 seguridad — autorización entre tenants

## Cambios

| Área | Cambio |
|------|--------|
| `auth-session.ts` | `resolveAuthSession` unifica `requireAuth` y `withAuth` (mensajes + `AuthContext`) |
| `delegate-club-scope.ts` / `assert-action-scope.ts` | Delegado por `clubId` en args; `LEAGUE_ADMIN` valida club ∈ liga operativa |
| `supabase/server.ts` | `createSupabaseServerFromCookies()` canónico en `lib/actions/*` |
| `admin-server.ts` | Service role solo vía `getSupabaseAdmin()` (`gallery`, `clubs`) |
| `ownership.ts` | Transferencia: lookup por email con Admin API (`findAuthUserIdByEmail`), sin SQL a `auth.users` |
| `ownership.ts` | `createClubAsDelegateAction` solo `CLUB_DELEGATE` con `league_id`, sin club previo |
| `onboarding/page.tsx` | Staff (`SUPER_ADMIN`/`LEAGUE_ADMIN`) redirige a `/liga/` |
| `buscarClubParaDocumento` | Delegado: solo su club; staff: liga operativa |
| `treasury.ts` | `requireAuth` + `assertTreasuryWriteClubAccess` por liga operativa |
| `withAuth` / `require-auth.ts` | Misma base; aislamiento tenant en args |
| `intranet-gate.ts` | Sin email hardcodeado en desarrollo |

### Tests (npm test)

- `delegate-club-scope.test.ts` — aislamiento delegado
- `treasury-scope.test.ts` — lectura acotada por club
- `busqueda365-league-scope.test.ts` — UUID + cache tag por liga

## Verificación manual

1. Delegado: buscar club en documentos → solo el suyo.
2. Admin liga sin liga activa → error al buscar clubes o crear movimiento tesorería en club ajeno.
3. Cuenta sin rol → no puede usar onboarding ni `createClubAsDelegateAction`.
4. `MASTER_SUPER_ADMIN_EMAIL` debe estar en `.env.local` para bypass local.
