import { NextRequest, NextResponse } from "next/server";
import {
  adminEmail,
  createChallengeToken,
  generateCode,
  missingConfig,
  cookieOptions,
  CHALLENGE_COOKIE,
} from "@/lib/gallery/auth";
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

  // Se valida toda la configuración antes de enviar nada: si falta algo, no
  // tiene sentido gastar un envío para fallar justo después.
  const missing = missingConfig();

  if (missing.length > 0) {
    console.error("[gallery] configuración incompleta:", missing.join(", "));
    return NextResponse.json(
      {
        message: `Faltan variables de entorno en el servidor: ${missing.join(", ")}`,
        missing,
      },
      { status: 500 },
    );
  }

  const allowed = adminEmail() as string;

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
