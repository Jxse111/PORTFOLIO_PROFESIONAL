import type { NextRequest } from 'next/server';
import { isValidEmail } from "@/lib/validation";

interface CommentData {
  name: string;
  email: string;
  comment: string;
  postTitle: string;
  postSlug: string;
}

const MAX_NAME_LENGTH = 100;
const MAX_COMMENT_LENGTH = 2000;

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

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return Response.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  try {
    const body: CommentData = await request.json();
    const { name, email, comment, postTitle, postSlug } = body;

    // Validar datos requeridos
    if (!name || !email || !comment || !postTitle) {
      return Response.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar email usando la utilidad compartida
    if (!isValidEmail(email)) {
      return Response.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar longitudes
    if (name.length > MAX_NAME_LENGTH) {
      return Response.json(
        { error: 'El nombre es demasiado largo' },
        { status: 400 }
      );
    }

    if (comment.trim().length < 10) {
      return Response.json(
        { error: 'El comentario debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      return Response.json(
        { error: 'El comentario es demasiado largo' },
        { status: 400 }
      );
    }

    // TODO: implementar almacenamiento real (base de datos) y/o envío de email.
    // No se registra PII en consola para evitar fugas de datos.

    return Response.json({
      success: true,
      message: 'Comentario enviado exitosamente'
    });

  } catch (error) {
    console.error('Error al procesar comentario:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
