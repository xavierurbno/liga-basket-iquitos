/** Aviso cuando la tabla `normativas` aún no existe en Postgres (la página `/normativas` sí existe en la app). */
export function NormativasMigrationHint() {
  return (
    <div
      role="alert"
      className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-6 text-left text-amber-950"
    >
      <p className="font-semibold">La página funciona; falta la tabla en la base de datos</p>
      <p className="mt-2 text-sm leading-relaxed">
        La ruta <code className="rounded bg-amber-100/80 px-1 text-xs">/normativas</code> es de esta aplicación. El
        aviso aparece porque Postgres (el proyecto enlazado con <code className="rounded bg-amber-100/80 px-1 text-xs">DATABASE_URL</code>){" "}
        aún no tiene la tabla{" "}
        <code className="rounded bg-amber-100/80 px-1">public.normativas</code> con columnas como{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs">titulo</code> y{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs">url_archivo</code>.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
        <li>Supabase del proyecto → SQL → New query.</li>
        <li>
          Pega y ejecuta el contenido del archivo{" "}
          <code className="rounded bg-amber-100/80 px-1 text-xs">
            supabase/migrations/0011_normativas_table.sql
          </code>{" "}
          del repositorio (crea enum, tabla, RLS y permisos).
        </li>
        <li>Recarga esta página.</li>
      </ol>
      <p className="mt-3 text-xs text-amber-900/80">
        Código habitual del motor: <code className="font-mono">42P01</code> (undefined_table).
      </p>
    </div>
  );
}
