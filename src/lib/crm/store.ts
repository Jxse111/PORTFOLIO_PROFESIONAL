import { list, put } from "@vercel/blob";
import { decryptJson, encryptJson } from "./crypto";

export interface CrmCredentials {
  email: string;
  passwordSalt: string;
  passwordHash: string;
  totpSecret: string;
  createdAt: string;
  updatedAt: string;
}

const PATH = "crm/auth.json";

/** El CRM no funciona sin almacenamiento: es donde vive el acceso. */
export function storageReady(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function readCredentials(): Promise<CrmCredentials | null> {
  if (!storageReady()) return null;

  try {
    const { blobs } = await list({ prefix: PATH, limit: 1 });
    const stored = blobs.find((blob) => blob.pathname === PATH);
    if (!stored) return null;

    const response = await fetch(stored.url, { cache: "no-store" });
    if (!response.ok) return null;

    return decryptJson<CrmCredentials>(await response.text());
  } catch (error) {
    console.warn("[crm] no se pudo leer el acceso", error);
    return null;
  }
}

export async function saveCredentials(credentials: CrmCredentials): Promise<void> {
  await put(PATH, encryptJson(credentials), {
    access: "public",
    contentType: "application/octet-stream",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}
