import { SESSION_COOKIE as GALLERY_SESSION_COOKIE, verifySessionToken } from "@/lib/gallery/auth";
import { cookies } from "next/headers";
import { CRM_SESSION_COOKIE, verifyCrmSessionToken } from "./session";

/** Sesión del CRM (contraseña + código). */
export function hasCrmSessionFromRequest(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${CRM_SESSION_COOKIE}=([^;]+)`));
  return verifyCrmSessionToken(match ? decodeURIComponent(match[1]) : undefined);
}

/** En páginas y acciones de servidor. */
export async function hasCrmSession(): Promise<boolean> {
  const store = await cookies();
  return verifyCrmSessionToken(store.get(CRM_SESSION_COOKIE)?.value);
}

/** El panel de siempre, con el código enviado al correo. */
export function hasEmailSessionFromRequest(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${GALLERY_SESSION_COOKIE}=([^;]+)`));
  return verifySessionToken(match ? decodeURIComponent(match[1]) : undefined);
}

/**
 * Para las rutas de subida y borrado: sirve tanto el CRM como el panel de
 * siempre, sin duplicar los permisos en dos sitios.
 */
export function isAdminRequest(request: Request): boolean {
  return hasCrmSessionFromRequest(request) || hasEmailSessionFromRequest(request);
}

/** El primer acceso solo puede crearse tras verificar el correo autorizado. */
export function canBootstrapFromRequest(request: Request): boolean {
  return hasEmailSessionFromRequest(request);
}
