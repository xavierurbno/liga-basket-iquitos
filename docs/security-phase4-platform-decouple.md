# Fase 4 — Desacople identidad LDDBI

## PR 4.1 — Landing genérica `/`

- `src/app/(public)/page.tsx` → `ProgramLeaguesDirectory`
- Query legado `/?l=slug` → 301 a `/l/{slug}/`
- LDDBI: `/l/lddbi/` y `/l/iquitos/` (según slug en BD)
- `/ligas/` redirige a `/`

## PR 4.2 — Liga por defecto configurable

Variables:

```
PLATFORM_DEFAULT_LEAGUE_SLUG=lddbi
NEXT_PUBLIC_DEFAULT_LEAGUE_ID=   # opcional UUID
PLATFORM_NAME=Plataforma de ligas
```

`leagueRepository.findDefaultForPortal()`:

1. `PLATFORM_DEFAULT_LEAGUE_SLUG`
2. `NEXT_PUBLIC_DEFAULT_LEAGUE_ID`
3. Primera liga por `createdAt`

`PRIMARY_PORTAL_LEAGUE_SLUGS` solo en seeds; runtime usa env.

## PR 4.3 — Defaults geográficos

Migración `0040_clubs_drop_geo_defaults.sql` — quita DEFAULT Iquitos/Maynas/Loreto.

Drizzle `schema.ts` sin `.default(...)` en district/province/region.

## PR 4.4 — Metadatos y copy

| Archivo | Cambio |
|---------|--------|
| `src/app/layout.tsx` | `PLATFORM_NAME` |
| `(public)/layout.tsx` | template título genérico |
| `(admin)/layout.tsx` | footer con `PLATFORM_NAME` |
| `login/page.tsx` | fallback «Plataforma de ligas» |
| `resolve-new-league-settings-defaults.ts` | torneos → `esquinas_color`, no `lddbi_template` |

## Despliegue

1. Aplicar migración 0040 en staging/prod
2. Vercel Production: `PLATFORM_DEFAULT_LEAGUE_SLUG=lddbi`, `PLATFORM_NAME=...`
3. Comunicar a usuarios: portada LDDBI ahora en `/l/lddbi/` (o slug configurado)

## Entregables

- [x] `/` = directorio de ligas
- [x] LDDBI solo en `/l/{slug}/`
- [x] Sin defaults geográficos en schema
- [ ] `PLATFORM_DEFAULT_LEAGUE_SLUG` en prod (operaciones)
