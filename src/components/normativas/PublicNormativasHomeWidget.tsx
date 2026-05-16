import Link from "next/link";

/**
 * Bloque FEB en la home (columna derecha): puerta de entrada a la normativa pública.
 * Sin listado de archivos; toda la tarjeta enlaza a `/normativas/`.
 */
export function PublicNormativasHomeWidget() {
  return (
    <section className="shrink-0" aria-labelledby="home-normativa-heading">
      <Link
        href="/normativas/"
        className="group flex flex-col rounded-sm border border-slate-200/90 bg-white px-4 py-3 shadow-sm transition hover:border-[#005CEE]/35 hover:shadow-[0_8px_24px_-12px_rgba(0,92,238,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CEE] sm:py-3.5"
      >
        <h2
          id="home-normativa-heading"
          className="border-b border-slate-100 pb-2.5 text-left text-[11px] font-black uppercase tracking-[0.18em] text-[#1e3a5f] transition group-hover:text-[#005CEE] sm:text-xs"
        >
          Normativa institucional
        </h2>
      </Link>
    </section>
  );
}
