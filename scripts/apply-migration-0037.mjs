/**
 * Aplica migración 0037 (prefijo serial documental por liga).
 * Uso: node scripts/apply-migration-0037.mjs
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
    join(root, "supabase/migrations/0037_document_serial_prefix.sql"),
    "utf8",
  );
  console.log("→ Aplicando 0037_document_serial_prefix.sql …");
  await sql.unsafe(body);

  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'league_settings'
      AND column_name = 'document_serial_prefix'
  `;
  console.log(
    cols.length
      ? "✓ league_settings.document_serial_prefix OK"
      : "⚠ Falta document_serial_prefix",
  );
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
