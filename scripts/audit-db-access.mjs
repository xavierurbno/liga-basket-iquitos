/**
 * Lista imports directos de Drizzle en capas que deberían usar repositories.
 *
 * Uso: npm run db:audit:access
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const appDir = join(root, "src/app");

const DB_IMPORT_RE =
  /from\s+["']@\/lib\/db\/client["']|from\s+["']@\/lib\/db\/schema["']|import\s*\{\s*db\s*\}/;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

const violations = [];
for (const file of walk(appDir)) {
  const text = readFileSync(file, "utf8");
  if (DB_IMPORT_RE.test(text)) {
    violations.push(relative(root, file));
  }
}

const repoDir = join(root, "src/repositories");
const repoCount = readdirSync(repoDir).filter((f) => f.endsWith(".ts")).length;

console.log(`Repositories: ${repoCount} archivos en src/repositories/`);
console.log(`Violaciones (db directo en src/app): ${violations.length}`);

if (violations.length > 0) {
  console.log("\nMigrar a repository o loader:");
  for (const v of violations.sort()) console.log(`  - ${v}`);
  process.exitCode = 1;
} else {
  console.log("\n✓ Ningún import de db en app/");
}
