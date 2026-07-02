/**
 * Diagnóstico (solo lectura): lista columnas reales de public.player_documents.
 * Detecta el desfase que causa el error 42703 (column "type" does not exist).
 *
 * Uso DEV:  node scripts/inspect-player-documents-columns.mjs
 * Uso PROD: APP_ENV=production node scripts/inspect-player-documents-columns.mjs
 */
import { loadAppEnv } from "./load-env.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

const production = process.argv.includes("--production");
loadAppEnv(production ? "production" : "development");

const EXPECTED = [
  "id",
  "player_id",
  "club_id",
  "type",
  "file_name",
  "storage_key",
  "public_url",
  "size_bytes",
  "mime_type",
  "verified",
  "verified_by",
  "verification_date",
  "expiration_date",
  "created_at",
];

const sql = await connectPostgres();
try {
  const rows = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_documents'
    ORDER BY ordinal_position
  `;

  if (rows.length === 0) {
    console.log("✗ La tabla public.player_documents NO existe.");
  } else {
    console.log("Columnas actuales de public.player_documents:");
    for (const r of rows) {
      console.log(`  - ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`);
    }
    const present = new Set(rows.map((r) => r.column_name));
    const missing = EXPECTED.filter((c) => !present.has(c));
    if (missing.length > 0) {
      console.log(`\n✗ Columnas faltantes: ${missing.join(", ")}`);
      console.log("→ Ejecuta la migración 0046 para repararlas.");
    } else {
      console.log("\n✓ Todas las columnas esperadas están presentes.");
    }
  }
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
