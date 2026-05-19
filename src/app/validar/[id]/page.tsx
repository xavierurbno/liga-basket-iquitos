import Image from "next/image";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { HiCheckCircle } from "react-icons/hi";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";

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

function resolvePublicImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.includes("/storage/v1/object/sign/")) {
    const [withoutQuery] = rawUrl.split("?");
    return withoutQuery.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const key = rawUrl.replace(/^\/+/, "");
  const hasBucket = key.startsWith("jugador-fotos/") || key.startsWith("club-assets/");
  if (hasBucket) return `${supabaseUrl}/storage/v1/object/public/${key}`;
  return `${supabaseUrl}/storage/v1/object/public/jugador-fotos/${key}`;
}

type ValidacionJugador = {
  kind: "player";
  clubName: string;
  categoriaNombre: string;
  playerName: string;
  documentType: string;
  documentNumber: string;
  carnetNumber: string | null;
  photoUrl: string | null;
};

type ValidacionCategoria = {
  kind: "category";
  clubName: string;
  categoriaNombre: string;
};

export default async function ValidarFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entityId = decodeURIComponent(id).trim();

  const [jugador] = await db
    .select({
      name: players.name,
      lastname: players.lastname,
      documentType: players.documentType,
      documentNumber: players.documentNumber,
      carnetNumber: players.carnetNumber,
      photoUrl: players.photoUrl,
      gender: players.gender,
      clubName: clubs.name,
      categoriaNombre: categories.name,
    })
    .from(players)
    .innerJoin(clubs, eq(players.clubId, clubs.id))
    .leftJoin(categories, eq(players.categoryId, categories.id))
    .where(eq(players.id, entityId))
    .limit(1);

  let registro: ValidacionJugador | ValidacionCategoria | null = null;

  if (jugador) {
    const catLine = jugador.categoriaNombre
      ? lineaCategoriaInstitucional(jugador.categoriaNombre, [jugador.gender])
      : "—";
    registro = {
      kind: "player",
      clubName: jugador.clubName,
      categoriaNombre: catLine,
      playerName: `${jugador.lastname}, ${jugador.name}`,
      documentType: jugador.documentType,
      documentNumber: jugador.documentNumber,
      carnetNumber: jugador.carnetNumber,
      photoUrl: resolvePublicImageUrl(jugador.photoUrl),
    };
  } else {
    const [categoria] = await db
      .select({
        clubName: clubs.name,
        categoriaNombre: categories.name,
      })
      .from(categories)
      .innerJoin(clubs, eq(categories.clubId, clubs.id))
      .where(eq(categories.id, entityId))
      .limit(1);

    if (categoria) {
      registro = {
        kind: "category",
        clubName: categoria.clubName,
        categoriaNombre: categoria.categoriaNombre,
      };
    }
  }

  if (!registro) redirect("/");

  const esJugador = registro.kind === "player";
  const jugadorRegistro: ValidacionJugador | null =
    registro.kind === "player" ? registro : null;

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]">
        <p className="text-center text-[11px] font-semibold tracking-[0.22em] text-slate-500">
          {esJugador ? "CREDENCIAL DEPORTISTA" : "VALIDACION OFICIAL"}
        </p>

        <section className="relative mt-5 flex items-center justify-center rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 py-6">
          {jugadorRegistro?.photoUrl ? (
            <div className="relative h-32 w-24 overflow-hidden rounded-xl border-2 border-slate-200 shadow-md">
              <Image
                src={jugadorRegistro!.photoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            </div>
          ) : (
            <Image
              src="/logos/liga.png"
              alt="Liga de Basket de Iquitos"
              width={128}
              height={128}
              className="object-contain opacity-95"
              priority
            />
          )}
          <div className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-md">
            <HiCheckCircle className="h-3.5 w-3.5" />
            <span>Registro válido</span>
          </div>
        </section>

        <section className="mt-6 space-y-3.5 text-sm">
          {jugadorRegistro ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Deportista
                </p>
                <p className="mt-1.5 text-base font-semibold text-slate-900">
                  {jugadorRegistro.playerName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {jugadorRegistro.documentType} {jugadorRegistro.documentNumber}
                </p>
              </div>
              {jugadorRegistro.carnetNumber ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-600">
                    N° carnet
                  </p>
                  <p className="mt-1.5 font-mono text-base font-bold text-blue-900">
                    {jugadorRegistro.carnetNumber}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Club</p>
            <p className="mt-1.5 text-base font-semibold text-slate-900">{registro.clubName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Categoria
            </p>
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
