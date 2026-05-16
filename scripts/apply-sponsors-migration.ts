import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import fs from "fs";
import path from "path";

const connectionString =
  process.env.DATABASE_URL_POOLED ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_DIRECT ||
  "";

if (!connectionString) {
  console.error("❌ No se encontró cadena de conexión en .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: connectionString.includes("supabase.co") ? "require" : false,
  max: 1,
  prepare: false,
});

async function runMigration() {
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "0008_create_sponsors_table.sql");
  console.log(`🔄 Leyendo migración desde: ${migrationPath}`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error("❌ El archivo de migración no existe.");
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, "utf-8");

  console.log("🚀 Aplicando migración sponsors en Supabase...");

  try {
    // Ejecutamos el SQL completo. postgres-js permite ejecutar múltiples sentencias en una sola llamada si prepare: false
    await sql.unsafe(sqlContent);
    console.log("✅ Migración aplicada exitosamente.");
  } catch (err) {
    console.error("❌ Error al aplicar la migración:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
