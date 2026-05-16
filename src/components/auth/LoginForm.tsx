"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { signInWithPasswordAction } from "@/lib/actions/auth";
import { FcGoogle } from "react-icons/fc";

export function LoginForm({
  initialLeagueSlug,
  postLoginRedirect,
}: {
  initialLeagueSlug?: string;
  /** Ruta interna tras login (p. ej. desde `?next=/liga/tesoreria`). Solo rutas que empiezan por `/`. */
  postLoginRedirect?: string | null;
}) {
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
  const authErrorFromUrl = searchParams?.get("auth_error");

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

    try {
      const result = await signInWithPasswordAction({
        email,
        password,
        leagueSlug,
        postLoginRedirect: resolvedPostLogin,
      });
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
      }
      /* Éxito: redirect() en la Server Action; no se llega aquí */
    } catch (err) {
      const digest = err && typeof err === "object" && "digest" in err ? String((err as { digest?: string }).digest) : "";
      if (digest.startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError(err instanceof Error ? err.message : "Error inesperado al iniciar sesión.");
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      // trailingSlash: true → callback con barra final; PKCE debe iniciarse en el navegador.
      const callbackUrl = `${origin}/auth/callback/?next=${encodeURIComponent(resolvedPostLogin)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("No se recibió la URL de Google. Revisa Redirect URLs en Supabase.");
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
        {(error || authErrorFromUrl) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error ?? authErrorFromUrl}
          </p>
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
