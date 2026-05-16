"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(
      "Hemos enviado un enlace de recuperación a tu correo. Por favor, revisa tu bandeja de entrada o spam."
    );
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Ingresa tu correo registrado
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Enviando…" : "Enviar enlace de recuperación"}
        </button>
      </form>

      <div className="pt-2 text-center">
        <p className="text-sm text-slate-600">
          <a href="/login" className="font-semibold text-[#1e3a5f] hover:underline">
            Volver al Login
          </a>
        </p>
      </div>
    </div>
  );
}
