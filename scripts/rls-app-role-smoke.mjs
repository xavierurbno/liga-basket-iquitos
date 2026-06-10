/**
 * Smoke test Fase 5b: liga_app sin JWT → 0 filas en tablas RLS; con claims → filas acotadas.
 * Uso: npm run db:smoke:rls-app
 * Requiere: DATABASE_URL_APP + migraciones 0042/0043 aplicadas.
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

const appUrl = process.env.DATABASE_URL_APP?.trim();
if (!appUrl) {
  console.error("DATABASE_URL_APP no definida. Ejecuta provision-liga-app-role.mjs primero.");
  process.exit(1);
}

const TABLES = ["players", "clubs", "categories", "tournaments", "treasury", "sponsors"];

const sql = postgres(appUrl, { max: 1, ssl: appUrl.includes("supabase.co") ? "require" : undefined });

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

try {
  console.log("→ liga_app sin JWT claims …");
  for (const table of TABLES) {
    const [{ count }] = await sql.unsafe(
      `SELECT count(*)::int AS count FROM public.${table}`,
    );
    if (Number(count) !== 0) {
      fail(`${table}: esperaba 0 filas sin claims, obtuvo ${count}`);
    } else {
      console.log(`  ✓ ${table}: 0 filas`);
    }
  }

  const sampleLeague = await sql`
    SELECT id::text FROM public.leagues ORDER BY created_at NULLS LAST LIMIT 1
  `;
  const leagueId = sampleLeague[0]?.id;
  if (!leagueId) {
    console.log("○ Sin ligas en BD; omitiendo prueba con claims");
  } else {
    const claims = JSON.stringify({
      sub: "00000000-0000-4000-8000-000000000001",
      role: "authenticated",
      app_metadata: {
        role: "LEAGUE_ADMIN",
        league_id: leagueId,
        active_league_id: leagueId,
      },
    });

    console.log("\n→ liga_app con JWT claims (LEAGUE_ADMIN, una liga) …");
    await sql.begin(async (tx) => {
      await tx.unsafe(`SELECT set_config('request.jwt.claims', $1, true)`, [claims]);
      const [{ count: playerCount }] = await tx.unsafe(
        `SELECT count(*)::int AS count FROM public.players WHERE league_id = $1::uuid`,
        [leagueId],
      );
      const [{ count: visiblePlayers }] = await tx.unsafe(
        `SELECT count(*)::int AS count FROM public.players`,
      );
      console.log(`  players visibles RLS: ${visiblePlayers} (total liga ${leagueId}: ${playerCount})`);
      if (Number(visiblePlayers) > Number(playerCount)) {
        fail("RLS devolvió más filas que las de la liga operativa");
      } else {
        console.log("  ✓ RLS acota lectura por liga");
      }
    });
  }

  if (!process.exitCode) {
    console.log("\n✓ Smoke test liga_app OK");
  }
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
