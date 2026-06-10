/**
 * Actualiza límites manuales del plan LDDBI en prod/dev.
 * Uso: node scripts/update-lddbi-plan-limits.mjs --production
 */
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

const production = process.argv.includes("--production");
const maxPlayers = Number.parseInt(process.env.LDDBI_MAX_PLAYERS ?? "3000", 10);
const maxTournaments = Number.parseInt(process.env.LDDBI_MAX_TOURNAMENTS ?? "20", 10);

loadAppEnv(production ? "production" : "development");
if (production) {
  assertSafeMigrationTarget({ target: "production", forceProd: true });
} else {
  assertSafeMigrationTarget({ target: "development" });
}

const sql = await connectPostgres();
try {
  const rows = await sql`
    UPDATE public.league_plans lp
    SET max_players = ${maxPlayers},
        max_active_tournaments = ${maxTournaments},
        updated_at = now()
    FROM public.leagues l
    WHERE lp.league_id = l.id AND l.slug = 'lddbi'
    RETURNING l.slug, lp.plan, lp.max_players, lp.max_active_tournaments
  `;
  if (rows.length === 0) {
    console.error("No se encontró liga con slug lddbi.");
    process.exitCode = 1;
  } else {
    console.log("✓ Plan LDDBI actualizado:", rows[0]);
  }
} finally {
  await sql.end({ timeout: 5 });
}
