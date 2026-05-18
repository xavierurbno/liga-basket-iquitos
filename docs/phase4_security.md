# Fase 4 — Seguridad de autorización

## Cambios en código

| Área | Cambio |
|------|--------|
| `read-user-role.ts` | Solo `app_metadata.role`; `user_metadata.role` ignorado en producción |
| `withAuth` | Usa `readUserRole`; rechaza usuarios sin rol en `app_metadata` |
| `dashboard-super-admin.ts` | Eliminado `NEXT_PUBLIC_ADMIN_EMAIL`; solo `DASHBOARD_ADMIN_EMAILS` (servidor) |
| Tests | `read-user-role.test.ts` |

`user_metadata` sigue usándose solo para **datos de perfil** (`full_name`), no para permisos.

## Migrar usuarios existentes (Supabase)

En **Authentication → Users**, cada cuenta de intranet debe tener en **App Metadata** (no User Metadata):

```json
{
  "role": "LEAGUE_ADMIN",
  "league_id": "<uuid-liga>",
  "club_id": "<uuid-club-si-delegado>"
}
```

Super admin con liga activa:

```json
{
  "role": "SUPER_ADMIN",
  "active_league_id": "<uuid-liga>"
}
```

Tras cambiar metadata, el usuario debe **cerrar sesión y volver a entrar** (o refrescar sesión) para que el JWT traiga los claims nuevos.

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `MASTER_SUPER_ADMIN_EMAIL` | Bypass intranet (`intranet-gate.ts`) — solo servidor |
| `DASHBOARD_ADMIN_EMAILS` | UI “super” en dashboard — comas, solo servidor |
| `SYSTEM_OWNER_EMAILS` | Crear clubes sin fricción |

No usar `NEXT_PUBLIC_*` para listas de administradores.

## Verificación

```bash
npm test
```

Incluye tests de `read-user-role` (no elevar privilegios vía `user_metadata`).
