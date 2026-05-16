import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

async function main() {
  console.log("Conectando a:", process.env.DATABASE_URL);
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    await sql`ALTER TABLE treasury ADD COLUMN IF NOT EXISTS notes text`;
    console.log("Columna añadida con éxito.");
  } catch (error) {
    console.error("Error al añadir columna:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
