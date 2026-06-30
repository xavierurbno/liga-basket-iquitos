import { NextResponse } from "next/server";
import { purgeAuditEvents } from "@/lib/observability/purge-audit-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === secret;
}

/** Purga mensual de `audit_events` (>1 año). Invocable por Vercel Cron o script ops. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeAuditEvents();
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        domain: "maintenance",
        type: "audit_events.purge",
        deleted: result.deleted,
        cutoff: result.cutoffIso,
      }),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/purge-audit]", error);
    return NextResponse.json({ ok: false, error: "Purge failed" }, { status: 500 });
  }
}
