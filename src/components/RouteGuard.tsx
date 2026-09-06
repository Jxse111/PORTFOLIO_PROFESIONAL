"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { protectedRoutes } from "@/resources";
import { Button, Heading, Column, PasswordInput } from "@once-ui-system/core";

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Puerta de contraseña para las rutas de `protectedRoutes`.
 *
 * Antes este componente también comprobaba en el navegador si la ruta estaba
 * activada, y para hacerlo tapaba TODA la web con un spinner en cada carga,
 * aunque el servidor ya hubiera enviado el HTML completo. Esa comprobación se
 * hace ahora en el servidor (ver `assertRouteEnabled`), así que aquí solo queda
 * la protección por contraseña: las páginas normales se pintan al instante.
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const pathname = usePathname() ?? "";

  // Se conoce de forma síncrona a partir de la configuración estática: no hace
  // falta ningún estado de carga para saberlo.
  const isProtected = Boolean(protectedRoutes[pathname as keyof typeof protectedRoutes]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(isProtected);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isProtected) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    fetch("/api/check-auth")
      .then((response) => {
        if (!cancelled) setIsAuthenticated(response.ok);
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isProtected, pathname]);

  const handlePasswordSubmit = async () => {
    const response = await fetch("/api/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setIsAuthenticated(true);
      setError(undefined);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  if (!isProtected || isAuthenticated) {
    return <>{children}</>;
  }

  if (checking) {
    // Solo ocurre en rutas protegidas, nunca en la navegación normal.
    return null;
  }

  return (
    <Column paddingY="128" maxWidth={24} gap="24" center>
      <Heading align="center" wrap="balance">
        Esta página está protegida con contraseña
      </Heading>
      <Column fillWidth gap="8" horizontal="center">
        <PasswordInput
          id="password"
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errorMessage={error}
        />
        <Button onClick={handlePasswordSubmit}>Entrar</Button>
      </Column>
    </Column>
  );
};

export { RouteGuard };
