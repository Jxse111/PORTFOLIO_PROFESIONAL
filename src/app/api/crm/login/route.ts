import { clearFailures, clientKey, delay, isBlocked, registerFailure } from "@/lib/crm/limiter";
import {
  CRM_SESSION_COOKIE,
  createCrmSessionToken,
  crmCookieOptions,
  verifyPassword,
} from "@/lib/crm/session";
import { readCredentials } from "@/lib/crm/store";
import { verifyTotp } from "@/lib/crm/totp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Entrada: contraseña + código de 6 dígitos de la app del iPhone. */
export async function POST(request: Request) {
  const key = clientKey(request);
  if (isBlocked(key)) {
    return NextResponse.json(
      { message: "Demasiados intentos. Espera 15 minutos." },
      { status: 429 },
    );
  }

  let body: { password?: string; code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
  }

  const credentials = await readCredentials();
  if (!credentials) {
    return NextResponse.json(
      { message: "El CRM todavía no tiene acceso configurado" },
      { status: 409 },
    );
  }

  const password = String(body.password ?? "");
  const code = String(body.code ?? "");

  const passwordOk = verifyPassword(password, credentials.passwordSalt, credentials.passwordHash);
  const codeOk = verifyTotp(credentials.totpSecret, code);

  if (!passwordOk || !codeOk) {
    registerFailure(key);
    await delay(400);
    return NextResponse.json({ message: "Contraseña o código incorrectos" }, { status: 401 });
  }

  clearFailures(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CRM_SESSION_COOKIE, createCrmSessionToken(), crmCookieOptions);
  return response;
}
