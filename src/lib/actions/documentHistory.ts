"use server";

import { db } from "@/lib/db/client";
import { documentHistory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { DocumentoInput } from "@/lib/pdf/documentosInstitucionalesPdf";

export type RegistroEmisionResult =
  | { ok: true; correlative: number; createdAt: string }
  | { ok: false; error: string };

export async function registrarEmisionDocumento(
  data: DocumentoInput & { shortIdentifier: string }
): Promise<RegistroEmisionResult> {
  try {
    const { type, entityId, shortIdentifier, ...snapshotData } = data;

    // Aseguramos que el snapshot contenga todo el payload incluyendo la data base64 de la foto
    const snapshot = data;

    const [row] = await db
      .insert(documentHistory)
      .values({
        type,
        entityId,
        shortIdentifier,
        snapshot,
      })
      .returning({
        correlative: documentHistory.correlative,
        createdAt: documentHistory.createdAt,
      });

    return {
      ok: true,
      correlative: row.correlative,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("[registrarEmisionDocumento]", error);
    return { ok: false, error: "Error al registrar la emisión del documento." };
  }
}

export async function obtenerUltimasEmisiones() {
  try {
    const rows = await db
      .select({
        id: documentHistory.id,
        type: documentHistory.type,
        shortIdentifier: documentHistory.shortIdentifier,
        correlative: documentHistory.correlative,
        createdAt: documentHistory.createdAt,
        snapshot: documentHistory.snapshot,
      })
      .from(documentHistory)
      .orderBy(desc(documentHistory.createdAt))
      .limit(20);

    return { ok: true, emisiones: rows };
  } catch (error) {
    console.error("[obtenerUltimasEmisiones]", error);
    return { ok: false, error: "Error al obtener el historial." };
  }
}
