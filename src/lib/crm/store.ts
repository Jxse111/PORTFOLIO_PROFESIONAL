import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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
const LOCAL_PATH = path.join(process.cwd(), ".data", "crm-auth.json");

/**
 * El CRM no funciona sin almacenamiento: es donde vive el acceso. En
 * desarrollo, si no hay Blob conectado, se guarda en un archivo local que no
 * se publica; en producción siempre hace falta el almacenamiento real.
 */
function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export function storageReady(): boolean {
  return useBlob() || process.env.NODE_ENV !== "production";
}

export async function readCredentials(): Promise<CrmCredentials | null> {
  if (!storageReady()) return null;

  if (!useBlob()) return readLocalCredentials();

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
  if (!useBlob()) {
    await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
    await writeFile(LOCAL_PATH, encryptJson(credentials), { mode: 0o600 });
    return;
  }

  await put(PATH, encryptJson(credentials), {
    access: "public",
    contentType: "application/octet-stream",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function readLocalCredentials(): Promise<CrmCredentials | null> {
  try {
    return decryptJson<CrmCredentials>(await readFile(LOCAL_PATH, "utf8"));
  } catch {
    return null;
  }
}
