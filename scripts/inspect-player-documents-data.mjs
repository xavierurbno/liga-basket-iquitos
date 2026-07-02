/**
 * Diagnóstico (solo lectura): conteo y muestra de public.player_documents.
 * Ayuda a decidir la estrategia de reparación (aditiva vs. migración de datos).
 *
 * Uso PROD: node scripts/inspect-player-documents-data.mjs --production
 */
import { loadAppEnv } from "./load-env.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

const production = process.argv.includes("--production");
loadAppEnv(production ? "production" : "development");

const sql = await connectPostgres();
try {
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM public.player_documents`;
  console.log(`Filas en public.player_documents: ${count}`);

  if (count > 0) {
    const sample = await sql`
      SELECT id, document_type, document_number, file_url, file_path, status, created_at
      FROM public.player_documents
      ORDER BY created_at DESC NULLS LAST
      LIMIT 10
    `;
    console.log("\nMuestra (hasta 10 filas):");
    for (const r of sample) {
      console.log(
        `  - ${r.id} | type=${r.document_type} | status=${r.status} | file_path=${r.file_path}`,
      );
    }

    const byType = await sql`
      SELECT document_type, count(*)::int AS n
      FROM public.player_documents
      GROUP BY document_type
      ORDER BY n DESC
    `;
    console.log("\nDistribución por document_type:");
    for (const r of byType) {
      console.log(`  - ${r.document_type}: ${r.n}`);
    }
  }
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
