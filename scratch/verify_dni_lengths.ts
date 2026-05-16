import { db } from "../src/lib/db/client";
import { players } from "../src/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function main() {
  console.log("Iniciando auditoría de integridad de DNIs...");

  const results = await db.select({
    id: players.id,
    name: players.name,
    lastname: players.lastname,
    documentNumber: players.documentNumber,
  })
  .from(players)
  .where(
    and(
      eq(players.documentType, "DNI"),
      sql`length(${players.documentNumber}) != 8`
    )
  );

  if (results.length === 0) {
    console.log("✅ Todos los DNIs cumplen con la regla de 8 dígitos.");
  } else {
    console.warn(`⚠️ Se encontraron ${results.length} registros con DNIs de longitud incorrecta:`);
    console.table(results);
    console.log("\nAcción sugerida: Corregir manualmente estos registros en el dashboard o Supabase.");
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error en la auditoría:", err);
  process.exit(1);
});
