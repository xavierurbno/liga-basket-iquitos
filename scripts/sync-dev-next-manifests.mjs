/** @deprecated Usar `scripts/prepare-webpack-dev.mjs` (npm run dev). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
spawnSync(process.execPath, [path.join(dir, "prepare-webpack-dev.mjs")], {
  stdio: "inherit",
  cwd: path.join(dir, ".."),
});
