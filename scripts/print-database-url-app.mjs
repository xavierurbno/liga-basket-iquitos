import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.production.local") });
const url = process.env.DATABASE_URL_APP?.trim();
if (!url) process.exit(1);
process.stdout.write(url);
