import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Verificación por correo sin base de datos.
 *
 * En serverless no hay memoria compartida entre instancias, así que en lugar
 * de guardar el código en el servidor lo firmamos con HMAC y guardamos solo la
 * firma en una cookie httpOnly. El código viaja únicamente por correo: quien
 * no lo reciba no puede fabricar una firma válida sin conocer el secreto.
 */

export const CHALLENGE_COOKIE = "gallery_challenge";
export const SESSION_COOKIE = "gallery_session";

/** El código caduca a los 10 minutos. */
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
/** Una sesión iniciada dura 2 horas. */
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Alfabeto sin caracteres ambiguos (0/O, 1/I/L) para que el código se pueda
 * teclear desde el móvil sin errores. 8 caracteres ≈ 1,1 billones de
 * combinaciones, lo que hace inviable adivinarlo a fuerza bruta.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function secret(): string {
  const value = process.env.GALLERY_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "GALLERY_AUTH_SECRET no está configurada o es demasiado corta (mínimo 32 caracteres).",
    );
  }
  return value;
}

/** Correo autorizado a subir imágenes. */
export function adminEmail(): string | undefined {
  return process.env.GALLERY_ADMIN_EMAIL?.trim().toLowerCase();
}

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Compara en tiempo constante para no filtrar información por el tiempo de respuesta. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Valor de la cookie que acompaña al código enviado por correo. */
export function createChallengeToken(email: string, code: string): string {
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const payload = `${email}:${code.toUpperCase()}:${expiresAt}`;
  return `${expiresAt}.${sign(payload)}`;
}

export function verifyChallengeToken(token: string, email: string, code: string): boolean {
  const [rawExpiry, signature] = token.split(".");
  const expiresAt = Number(rawExpiry);

  if (!signature || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const payload = `${email}:${code.trim().toUpperCase()}:${expiresAt}`;
  return safeEqual(signature, sign(payload));
}

/** Valor de la cookie de sesión que autoriza a subir imágenes. */
export function createSessionToken(email: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(`session:${email}:${expiresAt}`)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const email = adminEmail();
  if (!email) return false;

  const [rawExpiry, signature] = token.split(".");
  const expiresAt = Number(rawExpiry);

  if (!signature || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return safeEqual(signature, sign(`session:${email}:${expiresAt}`));
}

export const cookieOptions = {
  challenge: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: CHALLENGE_TTL_MS / 1000,
  },
  session: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  },
};
