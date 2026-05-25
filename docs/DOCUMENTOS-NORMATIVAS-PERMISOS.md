# Fase 6 — Documentos y normativas por liga

## Alcance de datos

| Recurso | Campo `league_id` | Notas |
|---------|-------------------|--------|
| `normativas` | Sí (FK `leagues`) | Migración `0020`; backfill a liga principal LDDBI/Iquitos |
| `document_history` | Sí (nullable) | Se rellena al emitir PDF desde la liga del jugador/club |

## Rutas públicas

| Ruta | Contenido |
|------|-----------|
| `/normativas/` | Normativas públicas de la **liga principal** (portada `/`) |
| `/l/[slug]/normativas/` | Normativas públicas **solo de esa liga** |

La ruta global no se elimina (compatibilidad Fase 1).

## Matriz de permisos

| Acción | SUPER_ADMIN | LEAGUE_ADMIN | CLUB_DELEGATE | Público (anon) |
|--------|-------------|--------------|---------------|----------------|
| Ver listado público de normativas | Sí (todas las ligas vía URL) | Sí (su liga) | Sí | Sí (`es_publico = true`) |
| Subir normativa (PDF + registro) | Sí (liga activa en cookie/panel) | Sí (solo su `league_id`) | No | No |
| Descargar archivo normativa | Sí | Sí | Sí (enlace público) | Sí (URL del storage) |
| Generar PDF institucional (carta/constancia/solvencia) | Sí (`/liga/documentos/`) | No* | No | No |
| Registrar emisión en historial | Sí | Sí** | Sí** | No |
| Ver historial de emisiones | Sí (filtrado por liga activa si hay cookie) | Sí (su liga) | Sí (su liga) | No |

\* Hoy la página `/liga/documentos/` redirige a no super-admin; el historial admite roles de delegado por si se abre el módulo más adelante.

\** Vía `requireAuth` en server actions; el delegado no tiene UI de generación masiva.

## PDFs y branding (`league_settings`)

- Logo de liga: `login_logo_url` vía `getInstitutionalLogosAction(leagueId)`.
- Colores: `portal_primary_color` y `portal_accent_color` aplicados en bandas y acentos de `documentosInstitucionalesPdf.ts`.
- Federación: logo fijo en `public/logos/federacion.png`.

## Staff y subida de normativas

1. El formulario envía `leagueId` oculto (liga del portal o liga operativa del panel).
2. `createNormativaDocumentAction` valida que `LEAGUE_ADMIN` solo escriba en su liga.
3. Archivos en storage: `normativas/{slug}/{uuid}.pdf`.
4. RLS en Postgres refuerza lectura/escritura por `app_metadata.league_id` (migración `0020`).

## Migraciones

```bash
node scripts/apply-migration-0020.mjs
```

SQL: `supabase/migrations/0020_normativas_and_docs_per_league.sql`
