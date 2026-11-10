import { SESSION_COOKIE, verifySessionToken } from "@/lib/gallery/auth";
import { ALLOWED_AUDIO_TYPES, AUDIO_PREFIX, MAX_AUDIO_BYTES } from "@/lib/podcast/config";
import { blobConfigured } from "@/lib/podcast/episodes";
import { issueSignedToken } from "@vercel/blob";
import { type HandleUploadPresignedBody, handleUploadPresigned } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** La autorización de subida dura 10 minutos: tiempo de sobra para elegir y subir. */
const UPLOAD_TOKEN_TTL_MS = 10 * 60 * 1000;

/**
 * El audio se sube del navegador directamente a Vercel Blob: una función
 * serverless no admite cuerpos de más de 4,5 MB y un episodio pesa mucho más.
 *
 * Aquí no se firma un token clásico de lectura/escritura (ese método exige
 * BLOB_READ_WRITE_TOKEN, que Vercel ya no inyecta en los stores conectados por
 * OIDC). En su lugar se emite una delegación de un solo uso y una URL firmada
 * para el pathname concreto: funciona tanto con OIDC como con el token clásico
 * y no da acceso al resto del almacén.
 */
export async function POST(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!blobConfigured()) {
    console.error("No hay ningún Blob store conectado al proyecto");
    return NextResponse.json(
      { message: "Almacenamiento no configurado: conecta un Blob store al proyecto" },
      { status: 500 },
    );
  }

  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
  }

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      // Solo se usa para verificar los avisos de "subida completada". Aquí no
      // configuramos callback (el índice se guarda desde el navegador), así que
      // el valor nunca se emplea; el SDK exige que exista.
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || "sin-callback",
      getSignedToken: async (pathname) => {
        if (!pathname.startsWith(AUDIO_PREFIX)) {
          throw new Error("Ruta de subida no permitida");
        }

        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ALLOWED_AUDIO_TYPES,
          maximumSizeInBytes: MAX_AUDIO_BYTES,
          validUntil: Date.now() + UPLOAD_TOKEN_TTL_MS,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: ALLOWED_AUDIO_TYPES,
            maximumSizeInBytes: MAX_AUDIO_BYTES,
            addRandomSuffix: true,
          },
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[podcast] fallo al firmar la subida", error);
    return NextResponse.json({ message: "No se pudo autorizar la subida" }, { status: 400 });
  }
}
