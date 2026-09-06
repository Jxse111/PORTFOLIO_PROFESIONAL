/** "hace 5 min", "hace 3 h", "ayer", "12 mar" — formato compacto para tarjetas. */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;

  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Considera "última hora" lo publicado en las últimas 2 horas. */
export function isBreaking(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 2 * 60 * 60 * 1000;
}

/** Máximo de noticias que pueden lucir el distintivo de "última hora". */
export const MAX_BREAKING = 3;

/**
 * Ids de las noticias que pueden mostrar el distintivo: las más recientes que
 * cumplan el criterio, sobre una lista ya ordenada de nueva a antigua.
 */
export function pickBreakingIds(items: { id: string; publishedAt: string }[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.size >= MAX_BREAKING) break;
    if (isBreaking(item.publishedAt)) ids.add(item.id);
  }
  return ids;
}
