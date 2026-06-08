/**
 * Verifica conexión, ref de proyecto y tablas mínimas.
 *
 * Uso: node scripts/db-verify.mjs development
 */
import { loadAppEnv, resolveProjectRef, refFromSupabaseUrl } from "./load-env.mjs";
import { isProdProjectRef } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

const target = process.argv[2] === "production" ? "production" : "development";
loadAppEnv(target);

const ref = resolveProjectRef();
const urlRef = refFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

console.log(`APP_ENV=${process.env.APP_ENV}`);
console.log(`SUPABASE_PROJECT_REF=${ref || "(no detectado)"}`);

if (ref && urlRef && ref !== urlRef) {
  console.error(`✗ Ref inconsistente: SUPABASE_PROJECT_REF=${ref} vs URL=${urlRef}`);
  process.exit(1);
}

if (target === "development" && ref && isProdProjectRef(ref)) {
  console.error("✗ .env.local apunta a PRODUCCIÓN. Usa credenciales DEV (txmnlszmumayyrisqeby).");
  process.exit(1);
}

async function main() {
  const sql = await connectPostgres();
  try {
    const tables = ["leagues", "clubs", "players", "categories", "league_settings"];
    for (const name of tables) {
      const [{ exists }] = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ${name}
        ) AS exists
      `;
      console.log(`${exists ? "✓" : "✗"} tabla ${name}`);
      if (!exists) process.exitCode = 1;
    }

    const expectedColumns = [
      { table: "league_settings", column: "document_serial_prefix" },
      { table: "league_settings", column: "carnet_signature_mode" },
    ];
    for (const { table, column } of expectedColumns) {
      const [{ exists }] = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = ${table}
            AND column_name = ${column}
        ) AS exists
      `;
      console.log(`${exists ? "✓" : "✗"} columna ${table}.${column}`);
      if (!exists) process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  if (process.exitCode === 1) {
    console.error("\nEjecuta: npm run db:bootstrap:dev");
  } else {
    console.log("\nBD verificada.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
