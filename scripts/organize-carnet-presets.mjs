/**
 * Mueve PNG desde public/carnet/_incoming/ a public/carnet/presets/.
 *
 * Uso: node scripts/organize-carnet-presets.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const incoming = path.join(root, "public", "carnet", "_incoming");
const presetsRoot = path.join(root, "public", "carnet", "presets");

const MOVES = [
  {
    sources: ["esquinas-color-anverso-template.png"],
    dest: path.join(presetsRoot, "esquinas-color", "anverso-template.png"),
  },
  {
    sources: ["esquinas-color-reverso-template.png"],
    dest: path.join(presetsRoot, "esquinas-color", "reverso-template.png"),
  },
  {
    sources: ["onda-color-anverso-template.png"],
    dest: path.join(presetsRoot, "onda-color", "anverso-template.png"),
  },
  {
    sources: ["onda-color-reverso-template.png"],
    dest: path.join(presetsRoot, "onda-color", "reverso-template.png"),
  },
  {
    sources: ["clasica-reverso-template.png", "_shared-clasica-reverso-template.png"],
    dest: path.join(presetsRoot, "_shared", "clasica-reverso-template.png"),
  },
];

async function findSource(sources) {
  for (const name of sources) {
    const full = path.join(incoming, name);
    try {
      await fs.access(full);
      return full;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function main() {
  let moved = 0;
  const missing = [];

  for (const { sources, dest } of MOVES) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const src = await findSource(sources);
    if (!src) {
      missing.push(sources[0]);
      continue;
    }
    await fs.copyFile(src, dest);
    console.log(`✓ ${path.relative(root, src)} → ${path.relative(root, dest)}`);
    moved += 1;
  }

  if (missing.length) {
    console.error("\nFaltan en public/carnet/_incoming/:");
    for (const name of missing) console.error(`  - ${name}`);
    process.exit(missing.length > 0 && moved === 0 ? 1 : 0);
  }

  console.log(`\nListo: ${moved} archivo(s) en public/carnet/presets/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
