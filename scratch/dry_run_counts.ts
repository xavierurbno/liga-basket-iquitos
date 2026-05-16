import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const p = await db.execute(sql`SELECT count(*) FROM players WHERE document_type IS NULL`);
  const c = await db.execute(sql`SELECT count(*) FROM clubs WHERE president_document_type IS NULL`);
  const cat = await db.execute(sql`SELECT count(*) FROM categories WHERE coach_document_type IS NULL`);
  
  console.log('--- Resumen de Registros Afectados (Dry Run) ---');
  console.log('Jugadores sin tipo:', p[0].count);
  console.log('Clubes (Presidente) sin tipo:', c[0].count);
  console.log('Categorías (Entrenador) sin tipo:', cat[0].count);
  process.exit(0);
}

main();
