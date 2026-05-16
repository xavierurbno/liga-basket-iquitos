"use client";

import { useTransition } from "react";
import { editarDeportistaAction } from "@/lib/actions/system-dashboard";

export function EditarDeportistaButton({
  clubId,
  categoryId,
  playerId,
  dni,
  lastname,
  name,
  birthdate,
  contacto,
  numeroPolo,
  photoUrl,
}: {
  clubId: string;
  categoryId: string;
  playerId: string;
  dni: string;
  lastname: string;
  name: string;
  birthdate: string;
  contacto: string | null;
  numeroPolo: number | null;
  photoUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
      onClick={() => {
        const newDni = window.prompt("DNI", dni) ?? dni;
        const newApellidos = window.prompt("Apellidos", lastname) ?? lastname;
        const newNombres = window.prompt("Nombres", name) ?? name;
        const newFechaNacimiento =
          window.prompt("Fecha de nacimiento (YYYY-MM-DD)", birthdate) ?? birthdate;
        const newContacto = window.prompt("Contacto", contacto ?? "") ?? "";
        const newNumeroPolo = window.prompt(
          "N° de Polo",
          numeroPolo ? String(numeroPolo) : ""
        ) ?? "";
        const newFotoUrl = window.prompt("Foto URL", photoUrl ?? "") ?? "";

        startTransition(async () => {
          const fd = new FormData();
          fd.set("clubId", clubId);
          fd.set("categoryId", categoryId);
          fd.set("playerId", playerId);
          fd.set("dni", newDni);
          fd.set("lastname", newApellidos);
          fd.set("name", newNombres);
          fd.set("birthdate", newFechaNacimiento);
          fd.set("adminPhone", newContacto);
          fd.set("numeroPolo", newNumeroPolo);
          fd.set("photoUrl", newFotoUrl);
          await editarDeportistaAction(fd);
        });
      }}
    >
      {pending ? "Guardando..." : "Editar"}
    </button>
  );
}
