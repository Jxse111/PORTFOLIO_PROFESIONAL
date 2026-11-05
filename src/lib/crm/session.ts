import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("base64url");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** La contraseña del CRM tiene que ser larga: no hay bloqueo de cuenta. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Usa al menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Mezcla letras y números.";
  }
  return null;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const CRM_SESSION_COOKIE = "crm_session";

export const crmCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

function sign(payload: string): string {
  const secret = process.env.GALLERY_AUTH_SECRET;
  if (!secret) throw new Error("GALLERY_AUTH_SECRET no está configurada");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createCrmSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(8).toString("base64url");
  return `${expiresAt}.${nonce}.${sign(`crm:${expiresAt}:${nonce}`)}`;
}

export function verifyCrmSessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const [rawExpiry, nonce, signature] = token.split(".");
  const expiresAt = Number(rawExpiry);
  if (!nonce || !signature || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expected = sign(`crm:${expiresAt}:${nonce}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
