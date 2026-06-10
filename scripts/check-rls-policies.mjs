import { loadAppEnv } from "./load-env.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

const production = process.argv.includes("--production");
loadAppEnv(production ? "production" : "development");

const sql = await connectPostgres();
try {
  const policies = await sql`
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('players', 'categories', 'league_settings', 'league_plans')
    ORDER BY tablename, policyname
  `;
  const rls = await sql`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('players', 'categories', 'league_settings', 'league_plans')
    ORDER BY c.relname
  `;
  console.log(`RLS (${production ? "production" : "development"}):`);
  for (const row of rls) {
    console.log(`  ${row.table_name}: RLS=${row.rls_enabled ? "ON" : "OFF"}`);
  }
  console.log(`Políticas: ${policies.length}`);
  for (const p of policies) {
    console.log(`  • ${p.tablename}.${p.policyname}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
