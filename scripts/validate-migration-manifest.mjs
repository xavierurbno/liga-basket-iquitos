/**
 * Valida que el manifest de migraciones no tenga huecos de archivo ni colisiones de prefijo.
 *
 * Uso: node scripts/validate-migration-manifest.mjs
 */
import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MIGRATION_SQL_ORDER } from "./db-migration-manifest.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const migrationsDir = join(root, "supabase/migrations");

/** Clave de orden: 4 dígitos + sufijo opcional a-z (ej. 0012b). */
const SORT_KEY_RE = /^(\d{4})([a-z]?)_/;

function sortKey(filename) {
  const m = SORT_KEY_RE.exec(filename);
  if (!m) return null;
  return `${m[1]}${m[2] ?? ""}`;
}

let failed = false;

for (const relativePath of MIGRATION_SQL_ORDER) {
  const full = join(root, relativePath);
  if (!existsSync(full)) {
    console.error(`✗ Falta en disco: ${relativePath}`);
    failed = true;
  }
}

const manifestFiles = MIGRATION_SQL_ORDER.map((p) => basename(p));
const manifestSet = new Set(manifestFiles);
const onDisk = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
const notInManifest = onDisk.filter((f) => !manifestSet.has(f));

if (notInManifest.length > 0) {
  console.warn("⚠ SQL en supabase/migrations/ fuera del manifest (no se aplican en bootstrap):");
  for (const f of notInManifest) console.warn(`    ${f}`);
}

const legacyBad = manifestFiles.filter((f) => /^002_|^003_/.test(f));
if (legacyBad.length > 0) {
  console.error(`✗ Prefijos legacy de 3 dígitos (usar NNNN o NNNNb_): ${legacyBad.join(", ")}`);
  failed = true;
}

const keys = new Map();
for (const file of manifestFiles) {
  const key = sortKey(file);
  if (!key) {
    console.error(`✗ Sin prefijo NNNN[a-z]_: ${file}`);
    failed = true;
    continue;
  }
  const list = keys.get(key) ?? [];
  list.push(file);
  keys.set(key, list);
}

for (const [key, files] of keys) {
  if (files.length > 1) {
    console.error(`✗ Colisión de clave de orden "${key}": ${files.join(", ")}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`✓ Manifest OK (${MIGRATION_SQL_ORDER.length} migraciones, ${onDisk.length} .sql en carpeta)`);
