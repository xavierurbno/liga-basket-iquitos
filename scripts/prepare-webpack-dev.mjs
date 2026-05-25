/**
 * Prepara `next dev --webpack`: stubs de manifiestos + limpieza de artefactos Turbopack/build
 * que provocan `__webpack_modules__[moduleId] is not a function`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextRoot = path.join(pkgRoot, ".next");
const devDir = path.join(nextRoot, "dev");
const stubDir = path.join(pkgRoot, "scripts", "dev-manifest-stubs");

const ROOT_MANIFESTS = [
  "routes-manifest.json",
  "prerender-manifest.json",
  "images-manifest.json",
  "app-path-routes-manifest.json",
  "required-server-files.json",
];

function rmDirIfExists(rel) {
  const target = path.join(nextRoot, rel);
  if (!fs.existsSync(target)) return false;
  fs.rmSync(target, { recursive: true, force: true });
  return true;
}

// Artefactos de `next build` / Turbopack incompatibles con webpack dev
const cleaned = [];
if (rmDirIfExists("turbopack")) cleaned.push("turbopack/");
if (rmDirIfExists("cache")) cleaned.push("cache/");

if (cleaned.length > 0) {
  console.log(
    `[prepare-webpack-dev] Eliminado ${cleaned.join(", ")} (restos de build/Turbopack). Si persisten errores: npm run clean`,
  );
}

fs.mkdirSync(devDir, { recursive: true });

let fromStubs = 0;
for (const name of ROOT_MANIFESTS) {
  const dst = path.join(devDir, name);
  if (fs.existsSync(dst)) continue;

  const stubSrc = path.join(stubDir, name);
  if (fs.existsSync(stubSrc)) {
    fs.copyFileSync(stubSrc, dst);
    fromStubs += 1;
  } else {
    console.warn(`[prepare-webpack-dev] Falta stub: ${stubSrc}`);
  }
}

if (fromStubs > 0) {
  console.log(
    `[prepare-webpack-dev] Rellenados ${fromStubs} manifiesto(s) en .next/dev/`,
  );
}
