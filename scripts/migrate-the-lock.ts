/**
 * Script para aplicar la migración de The Lock manualmente.
 * Ejecutar: node --require dotenv/config scripts/migrate-the-lock.js
 * o bien:  $env:NODE_ENV="script"; npx tsx scripts/migrate-the-lock.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL_POOLED ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_DIRECT ||
  "";

if (!connectionString) {
  console.error("❌ No se encontró DATABASE_URL_POOLED en .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: connectionString.includes("supabase.co") ? "require" : false,
  max: 1,
  prepare: false,
});

async function migrate() {
  console.log("🔄 Aplicando migración 0012d_the_lock_league_settings (manual)...");

  try {
    // 1. Añadir banner_text si no existe
    await sql`
      ALTER TABLE "league_settings"
        ADD COLUMN IF NOT EXISTS "banner_text" text;
    `;
    console.log("  ✅ banner_text añadido (o ya existía)");

    // 2. Añadir is_manual_override si no existe
    await sql`
      ALTER TABLE "league_settings"
        ADD COLUMN IF NOT EXISTS "is_manual_override" boolean NOT NULL DEFAULT false;
    `;
    console.log("  ✅ is_manual_override añadido (o ya existía)");

    // 3. Copiar datos de manual_override si existe la columna
    const cols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'league_settings'
        AND column_name = 'manual_override';
    `;

    if (cols.length > 0) {
      await sql`
        UPDATE "league_settings"
          SET "is_manual_override" = COALESCE("manual_override", false);
      `;
      console.log("  ✅ Datos copiados de manual_override → is_manual_override");

      await sql`
        ALTER TABLE "league_settings" DROP COLUMN "manual_override";
      `;
      console.log("  ✅ Columna manual_override eliminada");
    } else {
      console.log("  ℹ️  manual_override no existe, no hay nada que migrar");
    }

    console.log("\n✅ Migración completada exitosamente.");
  } catch (err) {
    console.error("❌ Error en la migración:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
