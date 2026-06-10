import { loadAppEnv } from "./load-env.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

async function checkDb(label) {
  const production = label === "production";
  loadAppEnv(production ? "production" : "development");
  const sql = await connectPostgres();
  try {
    const [{ district_default }] = await sql`
      SELECT column_default IS NOT NULL AS district_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clubs' AND column_name = 'district'
    `;
    const [{ league_plans }] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'league_plans'
      ) AS league_plans
    `;
    const [{ liga_app }] = await sql`
      SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'liga_app') AS liga_app
    `;
    const [{ count: rls_players }] = await sql`
      SELECT COUNT(*)::int AS count FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'players'
    `;
    const plans = await sql`
      SELECT l.slug, lp.max_players, lp.max_active_tournaments
      FROM public.league_plans lp
      JOIN public.leagues l ON l.id = lp.league_id
      ORDER BY l.slug
    `;
    console.log(`\n=== ${label.toUpperCase()} ===`);
    console.log(`0040 geo defaults: ${district_default ? "PENDIENTE" : "OK"}`);
    console.log(`0041 league_plans: ${league_plans ? "OK" : "PENDIENTE"}`);
    console.log(`0042 liga_app rol: ${liga_app ? "OK" : "PENDIENTE"}`);
    console.log(`0043 RLS players: ${rls_players > 0 ? `OK (${rls_players})` : "PENDIENTE"}`);
    for (const p of plans) {
      console.log(`  plan ${p.slug}: ${p.max_players} jugadores / ${p.max_active_tournaments} torneos`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

await checkDb("development");
await checkDb("production");
