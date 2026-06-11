import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getLegalDocumentMeta,
  isLegalDocumentId,
  type LegalDocumentId,
} from "./legal-documents";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const legalContentDir = resolve(projectRoot, "content", "legal");

function assertPathWithinLegalDir(filePath: string): void {
  const normalized = resolve(filePath);
  if (!normalized.startsWith(legalContentDir)) {
    throw new Error("Ruta de documento legal no permitida.");
  }
}

/** Lee Markdown estático autorizado desde `content/legal/` (lista blanca). */
export async function loadLegalDocumentMarkdown(id: LegalDocumentId): Promise<string> {
  if (!isLegalDocumentId(id)) {
    throw new Error("Documento legal no válido.");
  }

  const meta = getLegalDocumentMeta(id);
  const filePath = resolve(legalContentDir, meta.filename);
  assertPathWithinLegalDir(filePath);

  return readFile(filePath, "utf8");
}
