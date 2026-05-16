import { db } from "./src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clubs'
      ORDER BY ordinal_position;
    `);
    console.log("Resultado de la consulta (clubs):");
    console.log(res);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
