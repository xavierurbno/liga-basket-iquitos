## Summary

<!-- Qué cambia y por qué -->

## Test plan

- [ ] `npm test`
- [ ] `npm run build`
- [ ] Smoke manual en rutas afectadas

## Seguridad (si aplica)

- [ ] Server actions con auth o justificación de endpoint público
- [ ] Filtros por liga/club para roles no super-admin
- [ ] Sin PII en rutas públicas
- [ ] Migraciones SQL: RLS si la tabla es expuesta vía PostgREST

Ver `docs/security-phase4-hardening.md` y fases 1–3 en `docs/security-phase*.md`.
