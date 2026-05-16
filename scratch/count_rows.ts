
import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function countRows() {
  try {
    const tables = ['clubs', 'categories', 'players', 'treasury', 'transactions'];
    for (const table of tables) {
      const result = await db.execute(sql.raw(`SELECT count(*) FROM ${table}`));
      console.log(`${table}: ${JSON.stringify(result[0])}`);
    }
  } catch (error: any) {
    console.error("Error counting rows:", error.message);
  } finally {
    process.exit(0);
  }
}

countRows();
