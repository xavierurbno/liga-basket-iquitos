/**
 * Auditoría RLS ↔ tablas Drizzle (Fase 5b.3).
 * Uso: npm run db:audit:rls
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

/** Tablas public que la app toca vía Drizzle (schema.ts). */
const DRIZZLE_TABLES = [
  "leagues",
  "normativas",
  "clubs",
  "club_members",
  "user_assignments",
  "categories",
  "players",
  "treasury",
  "league_settings",
  "player_documents",
  "document_history",
  "ownership_history",
  "audit_events",
  "gallery_photos",
  "sponsors",
  "league_plans",
  "tournaments",
  "tournament_groups",
  "tournament_participants",
  "tournament_matches",
  "tournament_standings",
];

const url =
  process.env.DATABASE_URL_DIRECT?.trim() ||
  process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL no definida");
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: url.includes("supabase.co") ? "require" : undefined });

try {
  const rlsRows = await sql`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname = ANY(${DRIZZLE_TABLES})
    ORDER BY c.relname
  `;

  const policies = await sql`
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(${DRIZZLE_TABLES})
  `;

  const byTable = new Map();
  for (const p of policies) {
    if (!byTable.has(p.tablename)) byTable.set(p.tablename, []);
    byTable.get(p.tablename).push(p);
  }

  console.log("\n=== Matriz RLS ↔ Drizzle (Fase 5b) ===\n");
  console.log("Tabla | RLS | Políticas | Filtro liga/club");
  console.log("------|-----|-----------|------------------");

  let gaps = 0;
  for (const table of DRIZZLE_TABLES) {
    const row = rlsRows.find((r) => r.table_name === table);
    const rls = row?.rls_enabled === true;
    const pols = byTable.get(table) ?? [];
    const hasLeagueFilter = pols.some((p) => {
      const q = `${p.qual ?? ""} ${p.with_check ?? ""}`;
      return (
        q.includes("jwt_operational_league_id") ||
        q.includes("user_can_access_league") ||
        q.includes("user_can_read_tournament") ||
        q.includes("jwt_club_id") ||
        q.includes("jwt_role() = 'SUPER_ADMIN'") ||
        q.includes("league_id") ||
        q.includes("auth.uid()")
      );
    });
    const status = !rls
      ? "⚠ sin RLS"
      : pols.length === 0
        ? "⚠ sin políticas"
        : hasLeagueFilter
          ? "✓"
          : "⚠ revisar política";
    if (!rls || pols.length === 0 || !hasLeagueFilter) gaps += 1;
    console.log(
      `${table} | ${rls ? "on" : "off"} | ${pols.length} | ${status}`,
    );
  }

  console.log(`\nTablas con posible gap: ${gaps}`);
  if (gaps > 0) {
    console.log("Ver docs/security-phase5b-rls-app-role.md para remediación.");
    process.exitCode = 1;
  } else {
    console.log("✓ Cobertura RLS alineada con tablas Drizzle.");
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
