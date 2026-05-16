import { db } from "./src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Iniciando migración manual del sistema de identidad...");

    // 1. Crear Enum tipo_documento
    console.log("Creando tipo_documento enum...");
    try {
      await db.execute(sql`DO $$ BEGIN CREATE TYPE "tipo_documento" AS ENUM ('DNI', 'CE', 'PASAPORTE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    } catch (e) {
      console.log("El tipo tipo_documento ya existe o hubo un error manejado.");
    }

    // 2. Actualizar tabla CLUBS
    console.log("Actualizando tabla clubs...");
    await db.execute(sql`
      ALTER TABLE "clubs" 
      ADD COLUMN IF NOT EXISTS "president_document_type" "tipo_documento" DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "president_document_number" varchar(20),
      ADD COLUMN IF NOT EXISTS "secretary_document_type" "tipo_documento" DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "secretary_document_number" varchar(20),
      ADD COLUMN IF NOT EXISTS "treasurer_document_type" "tipo_documento" DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "treasurer_document_number" varchar(20);
    `);

    // 3. Actualizar tabla CATEGORIES
    console.log("Actualizando tabla categories...");
    await db.execute(sql`
      ALTER TABLE "categories" 
      ADD COLUMN IF NOT EXISTS "coach_document_type" "tipo_documento" DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "coach_document_number" varchar(20),
      ADD COLUMN IF NOT EXISTS "delegate_document_type" "tipo_documento" DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "delegate_document_number" varchar(20);
    `);

    // 4. Actualizar tabla PLAYERS
    console.log("Actualizando tabla players...");
    // Primero añadimos document_type
    await db.execute(sql`
      ALTER TABLE "players" 
      ADD COLUMN IF NOT EXISTS "document_type" "tipo_documento" NOT NULL DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "tutor_document_type" "tipo_documento" DEFAULT 'DNI',
      ADD COLUMN IF NOT EXISTS "tutor_document_number" varchar(20);
    `);

    // Si existe la columna 'dni', la renombramos a 'document_number'
    // Si ya existe 'document_number', no hacemos nada
    try {
      await db.execute(sql`ALTER TABLE "players" RENAME COLUMN "dni" TO "document_number";`);
      console.log("Columna 'dni' renombrada a 'document_number'.");
    } catch (e) {
      console.log("La columna 'dni' no existe o ya fue renombrada.");
    }

    // Aseguramos que document_number sea varchar(20)
    await db.execute(sql`ALTER TABLE "players" ALTER COLUMN "document_number" TYPE varchar(20);`);

    // 5. Crear Índices
    console.log("Creando índices...");
    try {
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "players_doc_club_idx" ON "players" ("document_type", "document_number", "club_id");`);
    } catch (e) {
      console.log("El índice players_doc_club_idx ya existe.");
    }

    console.log("¡Migración de identidad completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("Error crítico durante la migración:", error);
    process.exit(1);
  }
}

main();
