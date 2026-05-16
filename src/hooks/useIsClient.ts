"use client";

import { useEffect, useState } from "react";

/** True tras el primer montaje en el cliente (evita conflictos de hidratación con animaciones). */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}
