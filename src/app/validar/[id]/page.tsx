import Image from "next/image";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { HiCheckCircle } from "react-icons/hi";
import { db } from "@/lib/db/client";
import { categories, clubs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

function formatNow(): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());
}

export default async function ValidarFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = decodeURIComponent(id).trim();

  const [registro] = await db
    .select({
      clubName: clubs.name,
      categoriaNombre: categories.name,
    })
    .from(categories)
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(eq(categories.id, teamId))
    .limit(1);

  if (!registro) redirect("/");

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]">
        <p className="text-center text-[11px] font-semibold tracking-[0.22em] text-slate-500">
          VALIDACION OFICIAL
        </p>

        <section className="relative mt-5 flex items-center justify-center rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 py-6">
          <Image
            src="/logos/liga.png"
            alt="Liga de Basket de Iquitos"
            width={128}
            height={128}
            className="object-contain opacity-95"
            priority
          />
          <div className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-md">
            <HiCheckCircle className="h-3.5 w-3.5" />
            <span>Registro válido</span>
          </div>
        </section>

        <section className="mt-6 space-y-3.5 text-sm">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Club</p>
            <p className="mt-1.5 text-base font-semibold text-slate-900">{registro.clubName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Categoria</p>
            <p className="mt-1.5 text-base font-semibold text-slate-900">{registro.categoriaNombre}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Timestamp en vivo
            </p>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">{formatNow()}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
