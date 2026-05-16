"use client";

import { useState, useEffect, useMemo } from "react";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const INITIAL_RESULT: CountdownResult = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isExpired: true,
};

/**
 * Hook que calcula un contador en tiempo real hacia una fecha objetivo.
 * Optimizado para evitar bucles de actualización y errores de hidratación.
 */
export function useCountdown(targetDate: Date | string | null): CountdownResult {
  // 1. Estabilización de la dependencia: Convertir a timestamp
  const targetTimestamp = useMemo(() => {
    if (!targetDate) return null;
    const d = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    return d.getTime();
  }, [targetDate]);

  const [result, setResult] = useState<CountdownResult>(INITIAL_RESULT);
  const [mounted, setMounted] = useState(false);

  // 2. Prevención de Hidratación: Marcar montaje
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !targetTimestamp) {
      setResult(INITIAL_RESULT);
      return;
    }

    const calculate = (): CountdownResult => {
      const now = Date.now();
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        return INITIAL_RESULT;
      }

      const totalSeconds = Math.floor(diff / 1000);
      return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        isExpired: false,
      };
    };

    // Actualización inicial
    const initial = calculate();
    setResult(initial);

    if (initial.isExpired) return;

    // 3. Optimización del Effect: Intervalo con verificación de cambios
    const intervalId = setInterval(() => {
      const next = calculate();

      // Clave: Solo llama al setState si los valores han cambiado
      setResult((prev) => {
        if (
          prev.days === next.days &&
          prev.hours === next.hours &&
          prev.minutes === next.minutes &&
          prev.seconds === next.seconds &&
          prev.isExpired === next.isExpired
        ) {
          return prev;
        }
        return next;
      });

      // 4. Código Limpio: Limpiar si llega a cero
      if (next.isExpired) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [mounted, targetTimestamp]);

  return result;
}
