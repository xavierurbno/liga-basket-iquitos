import { pathToFileURL } from "node:url";
import { resolve as pathResolve, dirname } from "node:path";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const hooksDir = pathResolve(fileURLToPath(import.meta.url), "..");
const projectRoot = pathResolve(hooksDir, "..");
const srcRoot = pathResolve(projectRoot, "src");
const stubsRoot = pathResolve(projectRoot, "scripts/test-stubs");

const NEXT_STUBS = {
  "next/headers": "next-headers.mjs",
};

function isFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveExistingFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    pathResolve(basePath, "index.ts"),
    pathResolve(basePath, "index.tsx"),
    pathResolve(basePath, "index.js"),
  ];
  for (const candidate of candidates) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

function resolveAlias(specifier) {
  if (!specifier.startsWith("@/")) return null;
  return resolveExistingFile(pathResolve(srcRoot, specifier.slice(2)));
}

function resolveRelative(specifier, parentURL) {
  if (!specifier.startsWith(".")) return null;
  const parentPath = fileURLToPath(parentURL);
  return resolveExistingFile(pathResolve(dirname(parentPath), specifier));
}

function resolveNextStub(specifier) {
  const stubName = NEXT_STUBS[specifier];
  if (!stubName) return null;
  const stubPath = pathResolve(stubsRoot, stubName);
  return existsSync(stubPath) ? stubPath : null;
}

export async function resolve(specifier, context, nextResolve) {
  const stubPath = resolveNextStub(specifier);
  if (stubPath) {
    return nextResolve(pathToFileURL(stubPath).href, context);
  }

  const aliasPath = resolveAlias(specifier);
  if (aliasPath) {
    return nextResolve(pathToFileURL(aliasPath).href, context);
  }

  const relativePath = resolveRelative(specifier, context.parentURL);
  if (relativePath) {
    return nextResolve(pathToFileURL(relativePath).href, context);
  }

  return nextResolve(specifier, context);
}
