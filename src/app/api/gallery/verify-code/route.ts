import { NextRequest, NextResponse } from "next/server";
import {
  adminEmail,
  createSessionToken,
  verifyChallengeToken,
  cookieOptions,
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/gallery/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let code: string;

  try {
    const body = (await request.json()) as { code?: string };
    code = (body.code ?? "").trim();
  } catch {
    return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
  }

  const email = adminEmail();
  const challenge = request.cookies.get(CHALLENGE_COOKIE)?.value;

  if (!email || !challenge) {
    return NextResponse.json({ message: "Pide un código nuevo" }, { status: 400 });
  }

  if (!verifyChallengeToken(challenge, email, code)) {
    return NextResponse.json({ message: "Código incorrecto o caducado" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(email), cookieOptions.session);
  // El código ya se ha usado: se invalida.
  response.cookies.delete(CHALLENGE_COOKIE);
  return response;
}
