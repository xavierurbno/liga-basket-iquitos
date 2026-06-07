/**
 * Aplica migración 0036 (modo de firmas en reverso del carnet).
 * Uso: node scripts/apply-migration-0036.mjs
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
    join(root, "supabase/migrations/0036_carnet_signature_mode.sql"),
    "utf8",
  );
  console.log("→ Aplicando 0036_carnet_signature_mode.sql …");
  await sql.unsafe(body);

  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'league_settings'
      AND column_name = 'carnet_signature_mode'
  `;
  console.log(
    cols.length
      ? "✓ league_settings.carnet_signature_mode OK"
      : "⚠ Falta carnet_signature_mode",
  );
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
