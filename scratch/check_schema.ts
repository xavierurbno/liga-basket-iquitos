import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  for (const table of ['players', 'clubs', 'categories']) {
    console.log(`--- Table: ${table} ---`);
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${table}
      ORDER BY column_name;
    `);
    console.log(JSON.stringify(res, null, 2));
  }
  process.exit(0);
}

main();
