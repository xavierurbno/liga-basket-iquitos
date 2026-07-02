/**
 * Audita `players.photo_url` con URLs públicas legacy o paths que incluyen DNI.
 *
 * Uso:
 *   npm run ops:audit:player-photos
 *   npm run ops:audit:player-photos -- --json
 *
 * Requiere DATABASE_URL (lectura).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

const asJson = process.argv.includes("--json");

type PhotoAuditRow = {
  id: string;
  club_id: string;
  league_id: string | null;
  photo_url: string;
  issue: "legacy_public_url" | "dni_in_path" | "legacy_clubs_path";
};

function classifyPhotoUrl(photoUrl: string): PhotoAuditRow["issue"] | null {
  const v = photoUrl.trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) {
    return "legacy_public_url";
  }

  if (/\d{8,12}[-_]/.test(v) || /\/\d{8,12}[-_]/.test(v)) {
    return "dni_in_path";
  }

  if (v.startsWith("clubs/") && !v.startsWith("leagues/")) {
    return "legacy_clubs_path";
  }

  return null;
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("Falta DATABASE_URL en .env.local");
    process.exitCode = 1;
    return;
  }

  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    const rows = await sql<
      Array<{ id: string; club_id: string; league_id: string | null; photo_url: string }>
    >`
      SELECT id, club_id, league_id, photo_url
      FROM public.players
      WHERE photo_url IS NOT NULL
        AND trim(photo_url) <> ''
    `;

    const findings: PhotoAuditRow[] = [];
    for (const row of rows) {
      const issue = classifyPhotoUrl(row.photo_url);
      if (!issue) continue;
      findings.push({
        id: row.id,
        club_id: row.club_id,
        league_id: row.league_id,
        photo_url: row.photo_url,
        issue,
      });
    }

    const byIssue = findings.reduce<Record<string, number>>((acc, row) => {
      acc[row.issue] = (acc[row.issue] ?? 0) + 1;
      return acc;
    }, {});

    const summary = {
      scanned: rows.length,
      findings: findings.length,
      byIssue,
    };

    if (asJson) {
      console.log(JSON.stringify({ summary, findings }, null, 2));
    } else {
      console.log("Auditoría de fotos de jugadores");
      console.log(`  Filas con foto: ${summary.scanned}`);
      console.log(`  Hallazgos:      ${summary.findings}`);
      for (const [issue, count] of Object.entries(byIssue)) {
        console.log(`    - ${issue}: ${count}`);
      }
      if (findings.length > 0) {
        console.log("\nPrimeros 20 hallazgos:");
        for (const row of findings.slice(0, 20)) {
          console.log(`  [${row.issue}] player=${row.id} url=${row.photo_url}`);
        }
        if (findings.length > 20) {
          console.log(`  ... y ${findings.length - 20} más`);
        }
      }
    }

    if (findings.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 2 });
  }
}

await main();
