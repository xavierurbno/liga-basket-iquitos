/** Postgres undefined_table o mensaje típico cuando falta `public.normativas`. */
export function isMissingNormativasRelation(error: unknown): boolean {
  const check = (e: unknown): boolean => {
    if (!e || typeof e !== "object") return false;
    const o = e as { code?: string; message?: string };
    if (o.code === "42P01") return true;
    const msg = o.message ?? "";
    return (
      (msg.includes("relation") || msg.includes("table")) &&
      msg.includes("normativas") &&
      (msg.includes("does not exist") || msg.includes("no existe"))
    );
  };

  if (check(error)) return true;
  if (error && typeof error === "object" && "cause" in error) {
    return check((error as { cause?: unknown }).cause);
  }
  return false;
}
