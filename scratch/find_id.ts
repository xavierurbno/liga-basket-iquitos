
import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const tablesResult = await db.execute(sql`SELECT table_name FROM information_schema.columns WHERE column_name = 'id' AND table_schema = 'public'`);
  for (const row of tablesResult) {
    const tableName = row.table_name;
    try {
      const data = await db.execute(sql.raw(`SELECT * FROM ${tableName} WHERE id = 'dcaa681a-329e-4720-957e-d8142bc03513'`));
      if (data.length > 0) {
        console.log(`Found in ${tableName}`);
      }
    } catch (e) {}
  }
  process.exit(0);
}
main();
