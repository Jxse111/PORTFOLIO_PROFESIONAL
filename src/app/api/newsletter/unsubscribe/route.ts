import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import mailchimp from "@mailchimp/mailchimp_marketing";
import { createHash } from "crypto";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_API_SERVER,
});

// Simple in-memory rate limiter (use Redis/Upstash in production)
const attempts = new Map<string, number[]>();
function isRateLimited(ip: string, limit = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = attempts.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Demasiadas solicitudes" }, { status: 429 });
  }

  try {
    let body: { email?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
    }

    const { email } = body;
    const normalized = normalizeEmail(String(email || ""));

    if (!isValidEmail(normalized)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const subscriberHash = createHash("md5").update(normalized).digest("hex");

    try {
      await mailchimp.lists.updateListMember(
        process.env.MAILCHIMP_AUDIENCE_ID,
        subscriberHash,
        { status: "unsubscribed" }
      );

      return NextResponse.json({ ok: true, message: "Te has dado de baja del newsletter" });
    } catch (mailchimpError: unknown) {
      const error = mailchimpError as { response?: { body?: { title?: string } } };
      if (error?.response?.body?.title === "Resource Not Found") {
        return NextResponse.json({ ok: true, message: "El email no estaba suscrito" });
      }

      console.error("Mailchimp error:", mailchimpError);
      return NextResponse.json({ ok: false, error: "Error al conectar con Mailchimp" }, { status: 500 });
    }
  } catch (err) {
    console.error("/api/newsletter/unsubscribe error", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
