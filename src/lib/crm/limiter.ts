/**
 * Freno a la fuerza bruta. En serverless cada instancia lleva su propia
 * cuenta, así que es una barrera más, no la única: el código de 6 dígitos
 * cambia cada 30 segundos y la contraseña es larga.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

interface Attempt {
  failures: number;
  blockedUntil: number;
}

const attempts = new Map<string, Attempt>();

export function isBlocked(key: string): boolean {
  const attempt = attempts.get(key);
  if (!attempt) return false;
  if (attempt.blockedUntil > Date.now()) return true;
  if (attempt.blockedUntil > 0) attempts.delete(key);
  return false;
}

export function registerFailure(key: string): void {
  const now = Date.now();
  const attempt = attempts.get(key) ?? { failures: 0, blockedUntil: 0 };
  attempt.failures += 1;
  if (attempt.failures >= MAX_FAILURES) attempt.blockedUntil = now + WINDOW_MS;
  attempts.set(key, attempt);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/** Retardo fijo para no revelar por el tiempo qué factor ha fallado. */
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
