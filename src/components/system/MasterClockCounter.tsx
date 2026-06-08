"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { getLeagueSettingsAction } from "@/lib/actions/system-dashboard";
import { useCountdown } from "@/hooks/useCountdown";

// ─── Types ───────────────────────────────────────────────────
import { LeagueSettings } from "@/lib/types/league";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";

export interface MasterClockCounterProps {
  variant?: "flip" | "minimal" | "banner";
  /** Alineación del bloque (portal público: `start` con el eje del carrusel). */
  layoutAlign?: "center" | "start";
  /** Liga del portal visitado; si se omite, el servidor usa cookie o liga por defecto. */
  leagueId?: string | null;
}

// ─── Flip Card ───────────────────────────────────────────────
function FlipCard({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  const prevRef = useRef(display);
  const [flipping, setFlipping] = useState(false);
  const [prevDisplay, setPrevDisplay] = useState(display);

  useEffect(() => {
    if (prevRef.current !== display) {
      setPrevDisplay(prevRef.current);
      setFlipping(true);
      prevRef.current = display;

      const t = setTimeout(() => setFlipping(false), 400);
      return () => clearTimeout(t);
    }
  }, [display]);

  // Text container styles to ensure perfect vertical centering
  const textStyles = {
    color: "#F5F5F5",
    fontSize: 42,
    fontWeight: 900,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.02em",
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative select-none"
        style={{
          width: 64,
          height: 80,
          perspective: "400px",
          borderRadius: 14,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)", // Softened shadow
        }}
      >
        {/* Static Top Half */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            overflow: "hidden",
            background: "linear-gradient(180deg, #0065FF 0%, #005CEE 100%)",
            borderRadius: "14px 14px 0 0",
            zIndex: 2,
          }}
        >
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={textStyles}>{display}</span>
          </div>
        </div>

        {/* Static Bottom Half */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            overflow: "hidden",
            background: "linear-gradient(180deg, #004FCC 0%, #0047C0 100%)",
            borderRadius: "0 0 14px 14px",
            zIndex: 2,
          }}
        >
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", marginTop: -40 }}>
            <span style={textStyles}>{display}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "rgba(0,0,0,0.15)", zIndex: 10 }} />

        {/* Animated Top Flap (Previous Value) */}
        {flipping && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50%",
              overflow: "hidden",
              background: "linear-gradient(180deg, #0065FF 0%, #005CEE 100%)",
              borderRadius: "14px 14px 0 0",
              zIndex: 6,
              transformOrigin: "bottom center",
              transformStyle: "preserve-3d",
              animation: "flipDown 0.38s ease-in forwards",
            }}
          >
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden" }}>
              <span style={textStyles}>{prevDisplay}</span>
            </div>
          </div>
        )}

        {/* Animated Bottom Flap (New Value) */}
        {flipping && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50%",
              overflow: "hidden",
              background: "linear-gradient(180deg, #004FCC 0%, #0047C0 100%)",
              borderRadius: "0 0 14px 14px",
              zIndex: 5,
              transformOrigin: "top center",
              transformStyle: "preserve-3d",
              animation: "flipReveal 0.38s ease-out forwards",
            }}
          >
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", marginTop: -40 }}>
              <span style={textStyles}>{display}</span>
            </div>
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#1e3a5f",
          opacity: 0.75,
        }}
      >
        {label}
      </span>

      <style>{`
        @keyframes flipDown {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); opacity: 0; }
        }
        @keyframes flipReveal {
          0%   { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Separator ───────────────────────────────────────────────
function Separator() {
  return (
    <div className="flex flex-col gap-3 mb-6 self-center">
      <div className="h-2 w-2 rounded-full" style={{ background: "#005CEE", opacity: 0.7 }} />
      <div className="h-2 w-2 rounded-full" style={{ background: "#005CEE", opacity: 0.7 }} />
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────
function ClockSkeleton({ minimal }: { minimal?: boolean }) {
  if (minimal) {
    return <div className="h-7 w-32 rounded-lg bg-slate-200 animate-pulse" />;
  }
  return (
    <div className="flex gap-3 justify-center animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div className="rounded-xl" style={{ width: 64, height: 80, background: "rgba(0,92,238,0.12)" }} />
          <div className="rounded" style={{ height: 8, width: 36, background: "rgba(0,92,238,0.08)" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function MasterClockCounter({
  variant = "flip",
  layoutAlign = "center",
  leagueId,
}: MasterClockCounterProps) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const skipSettingsFetch =
    pathname.includes("/datasheet") ||
    pathname.includes("/carnet") ||
    pathname.includes("/documentos");

  useEffect(() => {
    let cancelled = false;
    setMounted(true);

    if (skipSettingsFetch) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void getLeagueSettingsAction(leagueId)
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skipSettingsFetch, leagueId]);

  const now = new Date();
  const endRaw = settings?.transferPeriodEnd ?? null;
  const end = endRaw ? new Date(endRaw) : null;
  const startRaw = settings?.transferPeriodStart ?? null;
  const start = startRaw ? new Date(startRaw) : null;
  const isManual = settings?.isManualOverride ?? false;

  const isScheduledActive =
    end !== null && start !== null && now >= start && now <= end;
  const isActive = isManual || isScheduledActive;
  const targetDate = isScheduledActive ? end : null;
  const countdown = useCountdown(targetDate);

  // ─── VALIDACIÓN CRÍTICA DE VISIBILIDAD ───
  if (!mounted || loading || !isActive) return null;
  if (!isManual && (countdown.isExpired || !end)) return null;

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005CEE] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#005CEE]" />
        </span>
        <span className="text-sm font-extrabold text-[#1e3a5f]">
          {isManual ? (
            <span className="text-[#005CEE] tracking-tight">{settings?.bannerText || "SISTEMA ACTIVO"}</span>
          ) : (
            <>
              CIERRE:{" "}
              <span className="text-[#005CEE] tabular-nums tracking-wide">
                {String(countdown.days).padStart(2, "0")}d : {String(countdown.hours).padStart(2, "0")}h : {String(countdown.minutes).padStart(2, "0")}m
              </span>
            </>
          )}
        </span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="w-full border-t border-blue-100/80 bg-blue-50/90">
        <div
          className={`${PORTAL_SHELL_CLASS} flex min-h-10 items-center justify-center gap-2 py-2 sm:justify-start sm:py-2.5`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005CEE] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#005CEE]" />
          </span>
          <p className="text-center text-xs font-bold leading-snug text-[#1e3a5f] sm:text-left sm:text-sm">
            <span className="uppercase tracking-wide text-[#005CEE]">Mercado de pases</span>
            <span className="mx-1.5 text-slate-300" aria-hidden>
              ·
            </span>
            {isManual ? (
              <span className="font-extrabold tracking-tight">
                {settings?.bannerText?.trim() || "Abierto"}
              </span>
            ) : (
              <span className="font-extrabold">
                Cierra en{" "}
                <span className="tabular-nums tracking-wide text-[#005CEE]">
                  {String(countdown.days).padStart(2, "0")}d : {String(countdown.hours).padStart(2, "0")}h :{" "}
                  {String(countdown.minutes).padStart(2, "0")}m
                </span>
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  const alignStart = layoutAlign === "start";

  if (isManual) {
    return (
      <div
        className={
          alignStart
            ? "w-full rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 text-left"
            : "w-full rounded-2xl border border-blue-100 bg-blue-50/60 px-6 py-5 text-center"
        }
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#005CEE]">
          Mercado de pases
        </p>
        <p className="mt-2 text-sm font-extrabold text-[#1e3a5f]">
          {settings?.bannerText?.trim() || "Mercado de pases abierto"}
        </p>
      </div>
    );
  }

  // ── Render Flip Variant ──
  return (
    <div
      className={
        alignStart
          ? "w-full py-5 text-left"
          : "w-full px-6 py-7 text-center"
      }
    >

      {loading ? (
        <ClockSkeleton />
      ) : (
        <div
          className={`flex items-center gap-1.5 sm:gap-2 ${alignStart ? "justify-start" : "justify-center"}`}
        >
          <FlipCard value={countdown.days} label="Días" />
          <Separator />
          <FlipCard value={countdown.hours} label="Horas" />
          <Separator />
          <FlipCard value={countdown.minutes} label="Min" />
          <Separator />
          <FlipCard value={countdown.seconds} label="Seg" />
        </div>
      )}

      {!loading && end && !isManual && (
        <p className="mt-5 text-[11px] font-medium" style={{ color: "#1e3a5f", opacity: 0.55 }}>
          Cierra el{" "}
          {end.toLocaleDateString("es-PE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
