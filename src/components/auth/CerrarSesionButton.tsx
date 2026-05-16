"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function CerrarSesionButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    
    // Limpiar cookie de inquilino activo
    document.cookie = "active_league_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    router.refresh();
    router.push("/");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={loading}
      className={
        className ??
        "text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
      }
    >
      {loading ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
