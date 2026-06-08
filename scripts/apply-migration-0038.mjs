/**
 * Aplica migración 0038 (backfill document_history.league_id + RLS).
 * Uso: node scripts/apply-migration-0038.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

const url =
  process.env.DATABASE_URL_DIRECT?.trim() ||
  process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL no definida en .env.local");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  const body = readFileSync(
    join(root, "supabase/migrations/0038_document_history_league_backfill.sql"),
    "utf8",
  );
  console.log("→ Aplicando 0038_document_history_league_backfill.sql …");
  await sql.unsafe(body);
  console.log("✓ Migración 0038 aplicada");
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
