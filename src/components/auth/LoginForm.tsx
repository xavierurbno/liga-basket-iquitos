"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { AuthError } from "@supabase/supabase-js";
import { FcGoogle } from "react-icons/fc";
import { signInWithGoogleAction } from "@/lib/actions/auth";

function mensajeLogin(error: AuthError): string {
  const msg = error.message ?? "";
  const lower = msg.toLowerCase();

  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return (
      "Correo o contraseña incorrectos. " +
      "Comprueba que el usuario exista en Supabase → Authentication → Users y que la contraseña sea la correcta."
    );
  }
  if (lower.includes("email not confirmed")) {
    return (
      "Debes confirmar el correo antes de entrar. Revisa tu bandeja (y spam), " +
      "o en desarrollo desactiva «Confirm email» en Authentication → Providers → Email."
    );
  }
  if (lower.includes("too many requests")) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }
  return msg || "No se pudo iniciar sesión.";
}

export function LoginForm({
  initialLeagueSlug,
  postLoginRedirect,
}: {
  initialLeagueSlug?: string;
  /** Ruta interna tras login (p. ej. desde `?next=/liga/tesoreria`). Solo rutas que empiezan por `/`. */
  postLoginRedirect?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const leagueSlug = searchParams?.get("l") || initialLeagueSlug;

  const resolvedPostLogin =
    postLoginRedirect &&
    postLoginRedirect.startsWith("/") &&
    !postLoginRedirect.startsWith("//")
      ? postLoginRedirect
      : "/liga/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signError) {
      setLoading(false);
      setError(mensajeLogin(signError));
      return;
    }

    // Si entramos desde una liga específica, guardamos el contexto en una cookie
    if (leagueSlug) {
      document.cookie = `active_league_slug=${leagueSlug}; path=/; max-age=${60 * 60 * 24 * 7}`;
    } else {
      // Si no hay slug, limpiamos la cookie para usar la liga por defecto del usuario
      document.cookie = "active_league_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    setLoading(false);
    router.refresh();
    router.push(resolvedPostLogin);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(resolvedPostLogin)}`;

      const res = await signInWithGoogleAction(callbackUrl);

      if (res.error) {
        setError(res.error);
        setGoogleLoading(false);
        return;
      }

      if (res.url) {
        window.location.href = res.url;
        return;
      }

      setError("No se pudo iniciar sesión con Google.");
      setGoogleLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al conectar con Google.");
      setGoogleLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <a 
              href="/forgot-password" 
              className="text-xs font-medium text-[#1e3a5f] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">O continuar con</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-[#005CEE] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-[#0050cf] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
          <FcGoogle className="h-4 w-4" />
        </div>
        {googleLoading ? "Conectando..." : "Continuar con Google"}
      </button>

      <div className="pt-2 text-center">
        <p className="text-sm text-slate-600">
          ¿No tienes una cuenta?{" "}
          <a href="/register" className="font-semibold text-[#1e3a5f] hover:underline">
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}
