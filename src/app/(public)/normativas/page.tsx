import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { FileText } from "lucide-react";
import { db, normativas } from "@/lib/db/client";
import type { Normativa } from "@/lib/db/schema";
import { PortalSiteHeaderBar, resolvePortalPanelHref } from "@/components/layout/PortalSiteHeader";
import { NormativaUploadForm } from "@/components/normativas/NormativaUploadForm";
import { NormativasMigrationHint } from "@/components/normativas/NormativasMigrationHint";
import { isMissingNormativasRelation } from "@/lib/normativas/normativas-db-error";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { canUploadNormativaDoc, readUserRole } from "@/lib/auth/read-user-role";

export const dynamic = "force-dynamic";

type NormativasLoadResult =
  | { kind: "list"; docs: Normativa[] }
  | { kind: "migration" }
  | { kind: "error"; message: string };

async function loadPublicNormativasForPage(): Promise<NormativasLoadResult> {
  try {
    const docs = await db
      .select()
      .from(normativas)
      .where(eq(normativas.esPublico, true))
      .orderBy(desc(normativas.createdAt));
    return { kind: "list", docs };
  } catch (err) {
    if (isMissingNormativasRelation(err)) {
      return { kind: "migration" };
    }
    console.error("[normativas] consulta pública:", err);
    return {
      kind: "error",
      message:
        "No se pudo cargar la lista de normativas. Comprueba la conexión a la base de datos o vuelve a intentar más tarde.",
    };
  }
}

async function loadNormativasPageRole(): Promise<string | undefined> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url?.trim() || !anon?.trim()) return undefined;
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return readUserRole(user);
  } catch {
    return undefined;
  }
}

function NormativasDocSection({ data }: { data: NormativasLoadResult }) {
  if (data.kind === "migration") {
    return (
      <div className="mt-8">
        <NormativasMigrationHint />
      </div>
    );
  }

  if (data.kind === "error") {
    return (
      <div
        role="alert"
        className="mt-10 rounded-sm border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-950"
      >
        <p className="font-semibold">No se pudo mostrar el listado</p>
        <p className="mt-2 leading-relaxed">{data.message}</p>
      </div>
    );
  }

  if (data.docs.length === 0) {
    return (
      <p className="mt-10 rounded-sm border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No hay documentos públicos en este momento.
      </p>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-slate-200 rounded-sm border border-slate-200 bg-white shadow-sm">
      {data.docs.map((doc) => (
        <li key={doc.id}>
          <a
            href={doc.urlArchivo}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5 sm:py-4"
          >
            <span
              className="inline-flex shrink-0 items-center justify-center rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:text-[10px]"
              aria-hidden
            >
              PDF
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <FileText
                className="hidden h-4 w-4 shrink-0 text-[#005CEE] opacity-70 sm:block"
                aria-hidden
              />
              <span className="min-w-0 text-[15px] font-semibold leading-snug text-[#005CEE] decoration-transparent underline-offset-2 group-hover:underline sm:text-base">
                {doc.titulo}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function NormativasPublicPage() {
  const [role, normativasData] = await Promise.all([
    loadNormativasPageRole(),
    loadPublicNormativasForPage(),
  ]);
  const isNormativasAdmin = canUploadNormativaDoc(role);
  const panelHref = isNormativasAdmin ? await resolvePortalPanelHref() : undefined;
  const showUploadForm = isNormativasAdmin && normativasData.kind !== "migration";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <PortalSiteHeaderBar
        variant="normativas"
        panelHref={panelHref}
        hidePanelGestión={!isNormativasAdmin}
      />
      <div className="border-b border-slate-200 bg-white">
        <div className={`${PORTAL_SHELL_CLASS} pb-6 pt-1 sm:pt-2`}>
          <header>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Transparencia</p>
            <h1
              id="normativas-lectura-heading"
              className="mt-2 text-2xl font-black tracking-tight text-[#1e3a5f] sm:text-3xl"
            >
              Normativa institucional
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Documentación oficial publicada por la liga. Solo se listan los documentos marcados como visibles en el
              portal público.
            </p>
          </header>
        </div>
      </div>

      <main className={`${PORTAL_SHELL_CLASS} py-8 pb-16`}>
        {showUploadForm ? (
          <section className="mb-10" aria-label="Carga de normativas (solo administradores)">
            <NormativaUploadForm />
          </section>
        ) : null}

        <section aria-labelledby="normativas-lectura-heading">
          <NormativasDocSection data={normativasData} />
        </section>
      </main>
    </div>
  );
}
