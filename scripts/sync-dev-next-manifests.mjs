/**
 * Next 16 (webpack dev) lee manifiestos en `.next/dev/`. Tras `npm run clean` no existen hasta un `next build`.
 * 1) Copia desde `.next/` (post-build) → `.next/dev/`
 * 2) Si falta algún archivo, copia desde `scripts/dev-manifest-stubs/` (versionado en el repo).
 *
 * @see package.json: `dev`, `postbuild`, `sync:dev-manifest`
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

fs.mkdirSync(devDir, { recursive: true });

let copied = 0;
let fromStubs = 0;

for (const name of ROOT_MANIFESTS) {
  const dst = path.join(devDir, name);
  const prodSrc = path.join(nextRoot, name);

  if (fs.existsSync(prodSrc)) {
    fs.copyFileSync(prodSrc, dst);
    copied += 1;
    continue;
  }

  if (!fs.existsSync(dst)) {
    const stubSrc = path.join(stubDir, name);
    if (fs.existsSync(stubSrc)) {
      fs.copyFileSync(stubSrc, dst);
      fromStubs += 1;
    } else {
      console.warn(`[sync-dev-next-manifests] Falta stub: ${stubSrc}`);
    }
  }
}

if (copied > 0) {
  console.log(`[sync-dev-next-manifests] Copiados ${copied} archivo(s) desde .next/ → .next/dev/`);
}
if (fromStubs > 0) {
  console.log(`[sync-dev-next-manifests] Rellenados ${fromStubs} archivo(s) desde scripts/dev-manifest-stubs/`);
}
