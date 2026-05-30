# Fase 6 — Deuda de producto / UX técnico

## 6.1 Rutas legado consolidadas

Módulo central: `src/lib/routing/legacy-route-redirects.ts` (usado desde `src/proxy.ts`).

| Ruta legado | Destino canónico |
|-------------|------------------|
| `/torneos/[leagueSlug]/[tournamentSlug]/` | `/l/[slug]/torneos/[tournamentSlug]/` (308) |
| `/liga/clubes/` | `/liga/clubs/` |
| `/dashboard/normativas/` | `/normativas/` |
| `/liga/busqueda-365/` | `/l/[cookie]/busqueda-365/` o `/busqueda-365/` |
| `/busqueda-365/` | Redirige a liga por defecto o `/ligas/` (página) |

Inventario exportado: `LEGACY_ROUTE_INVENTORY` (para métricas antes de eliminar páginas legado).

## 6.2 `system-dashboard.ts` dividido

| Módulo | Responsabilidad |
|--------|-----------------|
| `system-dashboard-helpers.ts` | Utilidades compartidas |
| `clubs.actions.ts` | Clubes, categorías, tesorería (movimientos) |
| `players.actions.ts` | Alta/edición/baja de deportistas |
| `settings.actions.ts` | Ajustes de liga y mercado de pases |
| `system-dashboard.ts` | Re-export (compatibilidad imports existentes) |

## 6.3 Supabase formalizado

- `supabase/config.toml` — proyecto CLI, auth local, función `process-player-image`
- `supabase/functions/` — Edge Functions versionadas
- Deploy: `npm run supabase:deploy:functions -- --project-ref <ref>`

Variables en Supabase Dashboard (no Vercel): `PROCESS_PLAYER_IMAGE_WEBHOOK_SECRET`, `BUCKET_PLAYERS`.

## 6.4 Búsqueda 365 multi-liga

- Portal por liga: `/l/[leagueSlug]/busqueda-365/` con copy «Jugadores registrados en {liga}»
- Legado `/busqueda-365/` redirige; sin copy «global» en el buscador activo
- `Busqueda365Client` acepta `leagueDisplayName` opcional para mensajes vacíos acotados a la liga
