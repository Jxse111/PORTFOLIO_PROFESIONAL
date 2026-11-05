import { canBootstrapFromRequest } from "@/lib/crm/guard";
import { hashPassword, passwordProblem } from "@/lib/crm/session";
import { readCredentials, saveCredentials, storageReady } from "@/lib/crm/store";
import { formatSecret, generateTotpSecret, otpauthUrl, verifyTotp } from "@/lib/crm/totp";
import { adminEmail } from "@/lib/gallery/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Alta del acceso al CRM. Solo puede hacerla quien ya ha demostrado ser el
 * dueño con el código enviado a su correo; después hay contraseña + app.
 */
export async function POST(request: Request) {
  if (!storageReady()) {
    return NextResponse.json({ message: "El almacenamiento no está configurado" }, { status: 500 });
  }

  if (!canBootstrapFromRequest(request)) {
    return NextResponse.json({ message: "Verifica antes tu correo" }, { status: 401 });
  }

  const current = await readCredentials();
  if (current) {
    return NextResponse.json(
      { message: "El CRM ya tiene acceso: usa la pantalla de entrada" },
      { status: 409 },
    );
  }

  let body: { action?: string; password?: string; secret?: string; code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
  }

  const email = adminEmail() ?? "";

  if (body.action === "secret") {
    const secret = generateTotpSecret();
    return NextResponse.json({
      secret: formatSecret(secret),
      raw: secret,
      otpauth: otpauthUrl(secret, email || "apple-slices"),
      email,
    });
  }

  if (body.action !== "finish") {
    return NextResponse.json({ message: "Acción no válida" }, { status: 400 });
  }

  const password = String(body.password ?? "");
  const secret = String(body.secret ?? "")
    .replace(/\s/g, "")
    .toUpperCase();
  const code = String(body.code ?? "");

  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ message: problem }, { status: 400 });

  if (secret.length < 16) {
    return NextResponse.json({ message: "Falta el secreto de la app" }, { status: 400 });
  }

  if (!verifyTotp(secret, code)) {
    return NextResponse.json(
      { message: "El código de 6 dígitos no es válido. Comprueba la hora del móvil." },
      { status: 400 },
    );
  }

  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();

  try {
    await saveCredentials({
      email,
      passwordSalt: salt,
      passwordHash: hash,
      totpSecret: secret,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("[crm] no se pudo guardar el acceso", error);
    return NextResponse.json({ message: "No se pudo guardar el acceso" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
