# Fase 3 seguridad — consistencia y operación

## Matriz de permisos (fuente de verdad)

| Capacidad | Fuente principal | Notas |
|-----------|------------------|-------|
| Rol intranet (`SUPER_ADMIN`, `LEAGUE_ADMIN`, `CLUB_DELEGATE`) | JWT `app_metadata.role` | `readUserRole` / `requireAuth` / `withAuth` |
| Liga operativa (staff) | Cookie `active_league_slug` + `app_metadata` | `resolveOperationalLeagueId` |
| Club del delegado | JWT `app_metadata.club_id` | Aislamiento en mutaciones |
| Bypass intranet / super | `MASTER_SUPER_ADMIN_EMAIL` | Solo servidor; desactivado si falta env |
| UI tabs sensibles dashboard | `DASHBOARD_ADMIN_EMAILS` | Complementa `SUPER_ADMIN`; no sustituye JWT |
| Tesorería escritura | `LIGA_ADMIN_EMAILS`, `SYSTEM_OWNER_EMAILS`, `club_members.role` | Paralelo a JWT; ver `treasury-access.ts` |
| Propietario club (onboarding) | `clubs.owner_id` | Fallback si aún no hay `club_id` en JWT |

**Regla:** permisos de acción (server actions) usan JWT + liga operativa. Listas de correo y `club_members` solo donde está documentado (tesorería, dashboard UI legacy).

## Cambios Fase 3

| Área | Cambio |
|------|--------|
| `document-emission-scope.ts` | Historial y emisiones acotados por liga/club |
| `documentHistory.ts` | Super admin ya no ve historial global sin liga activa |
| `documentos/page.tsx` | Acceso alineado con roles JWT (no solo dashboard email) |
| `storage-upload-guards.ts` | MIME, tamaño máx. 8 MB, paths seguros |
| `gallery.ts` / `clubs.ts` | Subidas/endurecimiento; delete por liga operativa |
| `treasury-access.ts` | (Fase 2) scope escritura por liga |

## Storage (service role)

- Tipos: JPG, PNG, WebP.
- Tamaño máximo: **8 MB** por archivo.
- Paths bajo `gallery/` sin `..` ni caracteres arbitrarios.
- Service role sigue en servidor; validación en app antes de subir.

## Base de datos dev / prod

- **Recomendado:** proyecto Supabase separado para desarrollo.
- **Actual:** BD compartida → no usar datos reales de deportistas en pruebas destructivas.
- Antes de migraciones SQL manuales, confirmar entorno (Preview vs Production en Vercel).

## Verificación manual

1. Super admin **sin** liga activa → historial documental pide seleccionar liga.
2. Delegado → historial solo emisiones de su club/jugadores.
3. Subir GIF a galería → rechazado.
4. Admin liga → no elimina fotos de otra liga en galería general.
