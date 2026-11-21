"use client";

import { useEffect, useState } from "react";

/**
 * Detecta dispositivos Apple por el user agent (iPhone, iPad, iPod y Mac).
 * Devuelve null hasta que se puede determinar en el cliente para no romper
 * la hidratación del renderizado del servidor.
 */
export function useIsAppleDevice() {
  const [isApple, setIsApple] = useState(null);

  useEffect(() => {
    const agent = navigator.userAgent || "";
    setIsApple(/iPad|iPhone|iPod|Macintosh/.test(agent));
  }, []);

  return isApple;
}

export default useIsAppleDevice;
