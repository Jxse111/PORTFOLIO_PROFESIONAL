import { NextRequest, NextResponse } from "next/server";
import { adminEmail, createChallengeToken, generateCode, cookieOptions, CHALLENGE_COOKIE } from "@/lib/gallery/auth";
import { sendGalleryCode } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let email: string;

  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ message: "Introduce un correo válido" }, { status: 400 });
  }

  const allowed = adminEmail();

  if (!allowed) {
    console.error("GALLERY_ADMIN_EMAIL no está configurada");
    return NextResponse.json({ message: "Subida no configurada" }, { status: 500 });
  }

  // Si el correo no es el autorizado respondemos igual que si lo fuera, para no
  // revelar cuál es la dirección válida. Simplemente no se envía nada.
  if (email !== allowed) {
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();

  try {
    await sendGalleryCode(email, code);
  } catch (error) {
    console.error("[gallery] fallo al enviar el código", error);
    return NextResponse.json({ message: "No se pudo enviar el correo" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CHALLENGE_COOKIE, createChallengeToken(email, code), cookieOptions.challenge);
  return response;
}
