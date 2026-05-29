# Fase 2 seguridad — autorización entre tenants

## Cambios

| Área | Cambio |
|------|--------|
| `ownership.ts` | `createClubAction` solo `CLUB_DELEGATE` con `league_id`, sin club previo |
| `onboarding/page.tsx` | Staff (`SUPER_ADMIN`/`LEAGUE_ADMIN`) redirige a `/liga/` |
| `buscarClubParaDocumento` | Delegado: solo su club; staff: liga operativa |
| `treasury.ts` | Escritura acotada por liga operativa (`assertTreasuryWriteClubAccess`) |
| `withAuth` | Aislamiento delegado también en args tipados con `clubId` |
| `require-auth.ts` | Usa `readUserRole` (no `user_metadata`) |
| `intranet-gate.ts` | Sin email hardcodeado en desarrollo |

## Verificación manual

1. Delegado: buscar club en documentos → solo el suyo.
2. Admin liga sin liga activa → error al buscar clubes o crear movimiento tesorería en club ajeno.
3. Cuenta sin rol → no puede usar onboarding ni `createClubAction`.
4. `MASTER_SUPER_ADMIN_EMAIL` debe estar en `.env.local` para bypass local.
