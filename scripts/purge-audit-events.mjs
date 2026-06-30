/**
 * Purga `audit_events` con antigüedad > AUDIT_EVENTS_RETENTION_YEARS (default 1).
 *
 * Uso:
 *   npm run ops:purge:audit-events
 *   npm run ops:purge:audit-events -- --dry-run
 *
 * Requiere DATABASE_URL (rol con DELETE en audit_events).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

const dryRun = process.argv.includes("--dry-run");

function retentionYears() {
  const raw = process.env.AUDIT_EVENTS_RETENTION_YEARS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("DATABASE_URL no configurada.");
    process.exit(1);
  }

  const years = retentionYears();
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    const [{ count }] = await sql`
      SELECT count(*)::int AS count
      FROM public.audit_events
      WHERE created_at < now() - (${years}::int || ' years')::interval
    `;

    console.log(`→ Filas a purgar (>${years} año(s)): ${count}`);

    if (dryRun) {
      console.log("Dry-run: no se eliminó nada.");
      return;
    }

    const deleted = await sql`
      DELETE FROM public.audit_events
      WHERE created_at < now() - (${years}::int || ' years')::interval
      RETURNING id
    `;

    console.log(`✓ Eliminadas ${deleted.length} fila(s) de audit_events.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
