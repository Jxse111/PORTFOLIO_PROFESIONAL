import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/gallery/auth";
import {
  BLOB_PREFIX,
  INDEX_PATH,
  blobConfigured,
  readUploadedImages,
  type UploadedImage,
} from "@/lib/gallery/images";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Nombre de archivo seguro: sin rutas, acentos ni caracteres raros. */
function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "imagen";
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Petición inválida" }, { status: 400 });
  }

  const file = form.get("file");
  const alt = String(form.get("alt") ?? "").trim();
  const orientation = String(form.get("orientation") ?? "horizontal");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Falta la imagen" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { message: "Formato no admitido. Usa JPG, PNG, WebP o AVIF." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "La imagen supera los 8 MB" }, { status: 413 });
  }

  if (alt.length < 3) {
    return NextResponse.json(
      { message: "Escribe una descripción de la imagen (mínimo 3 caracteres)" },
      { status: 400 },
    );
  }

  try {
    const blob = await put(`${BLOB_PREFIX}${Date.now()}-${safeName(file.name)}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    const entry: UploadedImage = {
      src: blob.url,
      alt: alt.slice(0, 300),
      orientation: orientation === "vertical" ? "vertical" : "horizontal",
      uploadedAt: new Date().toISOString(),
    };

    // El índice guarda los metadatos; Blob por sí solo no admite campos propios.
    const index = await readUploadedImages();
    await put(INDEX_PATH, JSON.stringify([entry, ...index], null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });

    return NextResponse.json({ ok: true, image: entry });
  } catch (error) {
    console.error("[gallery] fallo al subir la imagen", error);
    return NextResponse.json({ message: "No se pudo guardar la imagen" }, { status: 500 });
  }
}
