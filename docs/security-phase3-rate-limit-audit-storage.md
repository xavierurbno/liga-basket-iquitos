# Fase 3 — Rate limit, audit trail y storage

## PR 3.1 — Upstash Redis

Integración Vercel **Upstash for Redis** (recomendado) inyecta:

```
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Alias opcionales (misma base):

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Verificación: `npm run ops:verify:upstash`

Local / dev sin Redis:

```
SECURITY_RATE_LIMIT_DISABLED=true
```

Verificación: `npm run env:verify`

## PR 3.2 — Rate limit distribuido

- `src/lib/security/rate-limit.ts` — `checkRateLimit` async; Upstash → fallback memoria
- `src/lib/security/enforce-rate-limit.ts` — `await checkRateLimit`
- `src/proxy.ts` — `await maybeRateLimitResponse`

Sin Upstash, cada instancia Vercel mantiene contador local (comportamiento previo).

## PR 3.3 — Audit trail torneos

Acciones en `AUDIT_ACTIONS` (`record-audit.ts`):

| Acción | Trigger |
|--------|---------|
| `tournament.create` | `createTournamentWithFixture` |
| `tournament.publish` | `publishTournament` |
| `tournament.delete` | `deleteTournament` |
| `tournament.match_result` | `recordMatchResult` |
| `tournament.finish` | `finishTournament` |

Persistencia: tabla `audit_events` vía `recordAuditFromContext`.

## PR 3.4 — Storage `leagues/{leagueId}/...`

Helper: `src/lib/storage/league-storage-path.ts`

| Módulo | Path nuevo |
|--------|------------|
| `players.actions.ts` | `leagues/{leagueId}/clubs/{clubId}/players/...` |
| `sponsors.ts` | `leagues/{leagueId}/sponsors/{uuid}.ext` |
| `gallery.ts` | `leagues/{leagueId}/gallery/{uuid}.jpg` |
| `clubs.actions.ts` | categorías y recibos bajo `leagues/{leagueId}/clubs/...` |
| `normativas-admin.ts` | `leagues/{leagueId}/normativas/{slug}/...` |

Objetos legacy conservan URL en BD. Delete galería usa `storageObjectPathFromPublicUrl` (soporta ambos formatos).

Migración masiva opcional: `scripts/migrate-storage-paths.mjs` (no incluido; solo uploads nuevos).

## Tests

```bash
npx tsx --test src/lib/security/rate-limit.test.ts src/lib/storage/league-storage-path.test.ts
```

CI: usar `SECURITY_RATE_LIMIT_DISABLED=true` o mock sin Upstash.
