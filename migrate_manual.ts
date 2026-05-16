import { db } from "./src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Creando tabla documentos_historial...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "documentos_historial" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tipo" varchar(50) NOT NULL,
        "entity_id" uuid NOT NULL,
        "identificador_corto" varchar(20) NOT NULL,
        "correlativo" serial NOT NULL,
        "snapshot" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    console.log("Creando índices...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "docs_hist_entity_idx" ON "documentos_historial" ("entity_id");
      CREATE INDEX IF NOT EXISTS "docs_hist_tipo_idx" ON "documentos_historial" ("tipo");
    `);

    console.log("¡Migración completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("Error al migrar:", error);
    process.exit(1);
  }
}

main();
