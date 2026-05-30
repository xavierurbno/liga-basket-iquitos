/**
 * Lista migraciones aplicadas en drizzle.__drizzle_migrations (solo desarrollo).
 *
 * Uso: npm run db:dev:drizzle-migrations
 */
import { loadAppEnv } from "./load-env.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

loadAppEnv("development");

async function main() {
  const sql = await connectPostgres();
  try {
    const rows = await sql`
      SELECT id, hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `;
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
