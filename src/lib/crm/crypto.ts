import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Las credenciales del CRM se guardan cifradas (AES-256-GCM) antes de subirlas
 * al almacenamiento. La clave se deriva del secreto que ya usa el sitio para
 * firmar sesiones, así que quien lea el archivo no puede hacer nada con él.
 */

function key(): Buffer {
  const secret = process.env.GALLERY_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "GALLERY_AUTH_SECRET no está configurada o es demasiado corta (mínimo 32 caracteres).",
    );
  }
  return Buffer.from(hkdfSync("sha256", secret, "apple-slices-crm", "credentials", 32));
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptJson<T>(payload: string): T | null {
  try {
    const [rawIv, rawTag, rawBody] = payload.split(".");
    if (!rawIv || !rawTag || !rawBody) return null;

    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(rawIv, "base64url"));
    decipher.setAuthTag(Buffer.from(rawTag, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(rawBody, "base64url")),
      decipher.final(),
    ]);
    return JSON.parse(plain.toString("utf8")) as T;
  } catch {
    return null;
  }
}
