import { CHAT_SYSTEM_PROMPT } from "@/resources/chat-context";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

const DEFAULT_MODEL = "gemini-3.6-flash";

/** Límites defensivos: la API key es gratuita pero tiene cuota diaria. */
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 12;
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

type Role = "user" | "model";
interface IncomingMessage {
  role: Role;
  text: string;
}

/**
 * Rate limit en memoria. En serverless cada instancia tiene el suyo, así que no
 * es una barrera perfecta, pero corta el abuso obvio sin añadir dependencias.
 */
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Evita que el Map crezca sin control en instancias longevas.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}

function parseHistory(raw: unknown): IncomingMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (m): m is IncomingMessage =>
        !!m &&
        typeof m === "object" &&
        typeof (m as IncomingMessage).text === "string" &&
        ((m as IncomingMessage).role === "user" || (m as IncomingMessage).role === "model"),
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_LENGTH) }));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "El chat no está configurado. Falta GEMINI_API_KEY." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Has enviado demasiados mensajes seguidos. Espera un momento." },
      { status: 429 },
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "El mensaje está vacío." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const history = parseHistory(body.history);
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
        contents: [
          ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: "user", parts: [{ text: message }] },
        ],
        generationConfig: {
          temperature: 0.7,
          // Los tokens de razonamiento cuentan dentro de este límite: si se queda
          // corto, la respuesta llega cortada a mitad de frase.
          maxOutputTokens: 2000,
          // Preguntas de portfolio: no necesitan razonamiento profundo y así
          // la respuesta empieza a llegar mucho antes.
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    });
  } catch (error) {
    console.error("[chat] No se pudo contactar con Gemini:", error);
    return NextResponse.json(
      { error: "No se pudo contactar con el asistente. Inténtalo de nuevo." },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[chat] Gemini respondió ${upstream.status}:`, detail.slice(0, 500));

    const error =
      upstream.status === 429
        ? "El asistente ha alcanzado su límite de uso por hoy. Escríbeme por email."
        : "El asistente no está disponible ahora mismo.";

    return NextResponse.json({ error }, { status: 502 });
  }

  // Reenviamos el stream de Gemini como texto plano, trozo a trozo.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const text = parsed?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? "")
            .join("");
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // Un trozo SSE incompleto: lo ignoramos, llegará entero en el siguiente.
        }
      }
    },
  });

  return new Response(upstream.body.pipeThrough(stream), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
