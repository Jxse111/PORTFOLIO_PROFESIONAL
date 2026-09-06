import { notFound } from "next/navigation";
import { routes } from "@/resources";

/**
 * Desactiva una sección desde el servidor.
 *
 * Las rutas activas se declaran en `routes` (once-ui.config.ts). Comprobarlo en
 * el servidor devuelve un 404 real y evita tener que tapar la página con un
 * spinner mientras el navegador decide si puede mostrarla.
 */
export function assertRouteEnabled(path: keyof typeof routes) {
  if (!routes[path]) notFound();
}
