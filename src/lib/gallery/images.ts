import { list } from "@vercel/blob";
import { gallery } from "@/resources";

export interface GalleryImage {
  src: string;
  alt: string;
  orientation: string;
  /** true si la imagen se subió desde la web (vive en Vercel Blob). */
  uploaded?: boolean;
}

/** Prefijo bajo el que se guardan las imágenes subidas. */
export const BLOB_PREFIX = "gallery/";
/** Índice con los metadatos (alt, orientación) de las imágenes subidas. */
export const INDEX_PATH = `${BLOB_PREFIX}index.json`;

export interface UploadedImage {
  src: string;
  alt: string;
  orientation: "horizontal" | "vertical";
  uploadedAt: string;
}

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Lee el índice de imágenes subidas. Devuelve [] si aún no hay ninguna o si
 * el almacenamiento no está configurado: la galería estática sigue funcionando.
 */
export async function readUploadedImages(): Promise<UploadedImage[]> {
  if (!blobConfigured()) return [];

  try {
    const { blobs } = await list({ prefix: INDEX_PATH, limit: 1 });
    const index = blobs.find((blob) => blob.pathname === INDEX_PATH);
    if (!index) return [];

    const response = await fetch(index.url, { cache: "no-store" });
    if (!response.ok) return [];

    const parsed = (await response.json()) as unknown;
    return Array.isArray(parsed) ? (parsed as UploadedImage[]) : [];
  } catch (error) {
    console.warn("[gallery] no se pudo leer el índice de imágenes", error);
    return [];
  }
}

/**
 * Galería completa: primero lo que hayas subido (lo más reciente arriba) y
 * después las imágenes estáticas de content.tsx.
 */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  const uploaded = await readUploadedImages();

  const uploadedImages: GalleryImage[] = uploaded
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map((image) => ({
      src: image.src,
      alt: image.alt,
      orientation: image.orientation,
      uploaded: true,
    }));

  return [...uploadedImages, ...gallery.images];
}
