import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { CategoryWizardModal } from "@/components/system/CategoryWizardModal";
import { RegistroMasivoDeportistasModal } from "@/components/system/RegistroMasivoDeportistasModal";
import { eliminarDeportistaAction } from "@/lib/actions/system-dashboard";

export const dynamic = "force-dynamic";

function calcularEdad(transactionDate: Date | string | null): string {
  if (!transactionDate) return "N/D";
  const nacimiento = new Date(transactionDate);
  if (Number.isNaN(nacimiento.getTime())) return "N/D";
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return String(Math.max(edad, 0));
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

export default async function CategoriaDetallePage({
  params,
}: {
  params: Promise<{ clubId: string; categoryId: string }>;
}) {
  const { clubId: rawClubId, categoryId: rawCategoriaId } = await params;
  const clubId = decodeURIComponent(rawClubId).trim();
  const categoryId = decodeURIComponent(rawCategoriaId).trim();

  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      logoUrl: clubs.logoUrl,
      foundationDate: clubs.foundationDate,
    })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) redirect("/liga/clubs");

  const category = await db.query.categories.findFirst({
    where: (categories, { and, eq }) => 
      and(eq(categories.id, categoryId), eq(categories.clubId, clubId))
  });

  if (!category) redirect(`/liga/clubs/${clubId}`);

  if (category.clubId !== clubId) {
    redirect(`/liga/clubs/${category.clubId}/categories/${category.id}`);
  }

  const listaJugadores = await db
    .select({
      id: players.id,
      name: players.name,
      lastname: players.lastname,
      documentType: players.documentType,
      documentNumber: players.documentNumber,
      birthdate: players.birthdate,
      phone: players.phone,
      jerseyNumber: players.jerseyNumber,
      photoUrl: players.photoUrl,
    })
    .from(players)
    .where(and(eq(players.clubId, clubId), eq(players.categoryId, categoryId)))
    .orderBy(asc(players.lastname), asc(players.name));

  const listaJugadoresOrdenados = [...listaJugadores].sort((a, b) => {
    const lastname = a.lastname.localeCompare(b.lastname, "es", {
      sensitivity: "base",
      ignorePunctuation: true,
    });
    if (lastname !== 0) return lastname;
    return a.name.localeCompare(b.name, "es", {
      sensitivity: "base",
      ignorePunctuation: true,
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{club.name}</p>
          <h1 className="text-2xl font-bold text-slate-900">{category.name}</h1>
          {category.description && <p className="text-sm text-slate-600">{category.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/liga/clubs/${clubId}`} className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm">
            Atrás
          </Link>
          <Link
            href={`/liga/clubs/${clubId}/categories/${categoryId}/datasheet`}
            className="rounded-lg bg-[#3B82F6] px-3 py-2 text-sm font-semibold text-white"
          >
            Imprimir ficha
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#BFDBFE] bg-white p-5 lg:col-span-2">
          <h2 className="font-bold text-slate-900">Entrenador y Delegado asignados</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Entrenador</h3>
                <CategoryWizardModal
                  clubId={clubId}
                  mode="edit"
                  initialStep={2}
                  triggerLabel="Editar"
                  triggerClassName="rounded-md border border-[#BFDBFE] bg-white px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]"
                  initialData={{
                    categoryId,
                    name: category.name,
                    description: category.description,
                    coachName: category.coachName,
                    coachLastname: category.coachLastname,
                    coachDocumentType: category.coachDocumentType,
                    coachDocumentNumber: category.coachDocumentNumber,
                    coachBirthdate: category.coachBirthdate,
                    coachContact: category.coachContact,
                    coachEmail: category.coachEmail,
                    coachPhotoUrl: category.coachPhotoUrl,
                    delegateName: category.delegateName,
                    delegateLastname: category.delegateLastname,
                    delegateDocumentType: category.delegateDocumentType,
                    delegateDocumentNumber: category.delegateDocumentNumber,
                    delegateBirthdate: category.delegateBirthdate,
                    delegateContact: category.delegateContact,
                    delegateEmail: category.delegateEmail,
                    delegatePhotoUrl: category.delegatePhotoUrl,
                  }}
                />
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {[category.coachName, category.coachLastname]
                  .filter(Boolean)
                  .join(" ") || "No registrado"}
              </p>
              {resolvePublicImageUrl(category.coachPhotoUrl) && (
                <div className="mt-2 relative h-12 w-12 overflow-hidden rounded-md ring-1 ring-slate-200">
                  <Image
                    src={resolvePublicImageUrl(category.coachPhotoUrl)!}
                    alt="Foto entrenador"
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {category.coachDocumentNumber ? `${category.coachDocumentType || "DNI"}: ${category.coachDocumentNumber}` : "Documento no registrado"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {category.coachContact || "Sin contacto"} ·{" "}
                {category.coachEmail || "Sin correo"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Delegado</h3>
                <CategoryWizardModal
                  clubId={clubId}
                  mode="edit"
                  initialStep={3}
                  triggerLabel="Editar"
                  triggerClassName="rounded-md border border-[#BFDBFE] bg-white px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]"
                  initialData={{
                    categoryId,
                    name: category.name,
                    description: category.description,
                    coachName: category.coachName,
                    coachLastname: category.coachLastname,
                    coachDocumentType: category.coachDocumentType,
                    coachDocumentNumber: category.coachDocumentNumber,
                    coachBirthdate: category.coachBirthdate,
                    coachContact: category.coachContact,
                    coachEmail: category.coachEmail,
                    coachPhotoUrl: category.coachPhotoUrl,
                    delegateName: category.delegateName,
                    delegateLastname: category.delegateLastname,
                    delegateDocumentType: category.delegateDocumentType,
                    delegateDocumentNumber: category.delegateDocumentNumber,
                    delegateBirthdate: category.delegateBirthdate,
                    delegateContact: category.delegateContact,
                    delegateEmail: category.delegateEmail,
                    delegatePhotoUrl: category.delegatePhotoUrl,
                  }}
                />
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {[category.delegateName, category.delegateLastname]
                  .filter(Boolean)
                  .join(" ") || "No registrado"}
              </p>
              {resolvePublicImageUrl(category.delegatePhotoUrl) && (
                <div className="mt-2 relative h-12 w-12 overflow-hidden rounded-md ring-1 ring-slate-200">
                  <Image
                    src={resolvePublicImageUrl(category.delegatePhotoUrl)!}
                    alt="Foto delegado"
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {category.delegateDocumentNumber ? `${category.delegateDocumentType || "DNI"}: ${category.delegateDocumentNumber}` : "Documento no registrado"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {category.delegateContact || "Sin contacto"} · {category.delegateEmail || "Sin correo"}
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-[#BFDBFE] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Deportistas</h2>
              <p className="mt-2 text-sm text-slate-600">
                Registra varios deportistas seguidos sin cerrar el modal, o abre el formulario de inscripción
                individual.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/liga/clubs/${clubId}/categories/${categoryId}/players/nuevo`}
                className="rounded-lg bg-[#005CEE] px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#004FCC]"
              >
                + Inscribir Jugador
              </Link>
            </div>
          </div>
          <div className="mt-3">
            <RegistroMasivoDeportistasModal clubId={clubId} categoryId={categoryId} />
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-[#BFDBFE] bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Deportistas Registrados</h2>
        {listaJugadores.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Aún no hay deportistas registrados en esta categoría
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Jugador</th>
                  <th className="px-2 py-2">Documento</th>
                  <th className="px-2 py-2">Fecha de Nacimiento</th>
                  <th className="px-2 py-2">Edad</th>
                  <th className="px-2 py-2">Contacto</th>
                  <th className="px-2 py-2">Foto</th>
                  <th className="px-2 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaJugadoresOrdenados.map((j, idx) => (
                  <tr key={j.id} className="border-b last:border-0">
                    <td className="px-2 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-2 py-2 font-medium text-slate-900">
                      {j.lastname.toUpperCase()}, {j.name}
                    </td>
                    <td className="px-2 py-2 text-slate-700">
                      <span className="text-[10px] text-slate-400">{j.documentType}:</span> {j.documentNumber}
                    </td>
                    <td className="px-2 py-2 text-slate-700">
                      {j.birthdate
                        ? new Date(j.birthdate).toLocaleDateString("es-PE")
                        : "N/D"}
                    </td>
                    <td className="px-2 py-2 text-slate-700">{calcularEdad(j.birthdate)}</td>
                    <td className="px-2 py-2 text-slate-700">{j.phone || "N/D"}</td>
                    <td className="px-2 py-2 text-slate-700">
                      {resolvePublicImageUrl(j.photoUrl) ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-md ring-1 ring-slate-200">
                          <Image
                            src={resolvePublicImageUrl(j.photoUrl)!}
                            alt={`Foto de ${j.name} ${j.lastname}`}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        "Sin foto"
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <RegistroMasivoDeportistasModal
                          clubId={clubId}
                          categoryId={categoryId}
                          mode="edit"
                          triggerLabel="Editar"
                          triggerClassName="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                          initialData={{
                            playerId: j.id,
                            documentType: j.documentType,
                            documentNumber: j.documentNumber,
                            lastname: j.lastname,
                            name: j.name,
                            birthdate: j.birthdate
                              ? new Date(j.birthdate).toISOString().slice(0, 10)
                              : "",
                            contacto: j.phone || "",
                            numeroPolo: j.jerseyNumber ? String(j.jerseyNumber) : "",
                            fotoActual: j.photoUrl || "",
                          }}
                        />
                        <form action={eliminarDeportistaAction as any}>
                          <input type="hidden" name="clubId" value={clubId} />
                          <input type="hidden" name="categoryId" value={categoryId} />
                          <input type="hidden" name="playerId" value={j.id} />
                          <button className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
