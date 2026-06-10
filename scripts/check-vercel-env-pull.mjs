import { readFileSync, existsSync } from "node:fs";

const f = process.argv[2] ?? ".env.vercel.check.tmp";
if (!existsSync(f)) {
  console.error("Falta", f);
  process.exit(1);
}
const t = readFileSync(f, "utf8");
for (const k of [
  "PLATFORM_DEFAULT_LEAGUE_SLUG",
  "PLATFORM_NAME",
  "USE_APP_DB_ROLE",
  "USE_APP_DB_ROLE_WRITES",
  "SIGNUP_ENABLED",
  "DATABASE_URL_APP",
]) {
  const m = t.match(new RegExp(`${k}="([^"]*)"`));
  if (!m) {
    console.log(`${k}: MISSING`);
    continue;
  }
  const bad = m[1].includes("\r") || m[1].includes("\n");
  console.log(`${k}: ${bad ? "TIENE SALTO DE LINEA" : "OK"}`);
}
