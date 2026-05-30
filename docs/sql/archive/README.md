# SQL archivado

Archivos de referencia o borradores que **no** forman parte de `npm run db:bootstrap:dev`.

| Archivo | Motivo |
|---------|--------|
| `rls_policies_legacy.sql` | Borrador Fase 3; políticas canónicas en migraciones `0009`, `0012c`, `0017`. |

Para aplicar el esquema completo en una BD vacía, usar solo el manifest en `scripts/db-migration-manifest.mjs`.
