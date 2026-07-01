/**
 * Verifica DATABASE_URL_APP en .env.production.local (sin imprimir secretos).
 * Uso: node scripts/verify-prod-database-url-app.mjs
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.production.local") });

const url = process.env.DATABASE_URL_APP?.trim();
if (!url) {
  console.error("✗ DATABASE_URL_APP no definida en .env.production.local");
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: url.includes("supabase.co") ? "require" : undefined });

try {
  const [{ count: leagues }] = await sql`SELECT count(*)::int AS count FROM public.leagues`;
  const [{ bypass }] = await sql`
    SELECT rolbypassrls AS bypass FROM pg_roles WHERE rolname = 'liga_app'
  `;
  const [{ players }] = await sql`
    SELECT count(*)::int AS players FROM public.players
  `;

  console.log(`✓ Conexión PROD vía liga_app OK`);
  console.log(`  leagues: ${leagues}`);
  console.log(`  players (sin JWT, RLS): ${players}`);
  console.log(`  liga_app.rolbypassrls: ${bypass}`);

  if (Number(players) !== 0) {
    console.error("✗ Se esperaban 0 players sin JWT claims");
    process.exitCode = 1;
  } else {
    console.log("✓ RLS bloquea lectura sin claims");
  }
} catch (err) {
  console.error("✗ Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
