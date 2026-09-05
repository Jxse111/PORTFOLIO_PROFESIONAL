import { NEWS_SOURCES, type NewsCategory } from "./sources";
import { fetchFeed } from "./rss";
import type { NewsItem } from "./types";

export { NEWS_SOURCES, NEWS_CATEGORIES, type NewsCategory } from "./sources";
export { NEWS_REVALIDATE_SECONDS } from "./rss";
export type { NewsItem } from "./types";

/** Descarta duplicados (la misma noticia replicada en varias fuentes). */
function dedupe(items: NewsItem[]): NewsItem[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: NewsItem[] = [];

  for (const item of items) {
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]+/gi, "").slice(0, 60);
    if (seenIds.has(item.id) || seenTitles.has(titleKey)) continue;
    seenIds.add(item.id);
    seenTitles.add(titleKey);
    result.push(item);
  }

  return result;
}

/**
 * Agrega todas las fuentes en una única lista ordenada de más reciente a más
 * antigua. Las fuentes que fallen se ignoran: la página nunca se cae por un
 * feed caído.
 */
export async function getNews(options?: { category?: NewsCategory; limit?: number }): Promise<NewsItem[]> {
  const sources = options?.category
    ? NEWS_SOURCES.filter((source) => source.category === options.category)
    : NEWS_SOURCES;

  const settled = await Promise.allSettled(sources.map(fetchFeed));

  const items = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  const sorted = dedupe(items).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return options?.limit ? sorted.slice(0, options.limit) : sorted;
}

/**
 * Selección para la portada: intenta repartir entre categorías para que el
 * carrusel no se llene con una sola fuente.
 */
export async function getFeaturedNews(limit = 8): Promise<NewsItem[]> {
  const all = await getNews();
  const featured: NewsItem[] = [];
  const perSource = new Map<string, number>();

  for (const item of all) {
    const used = perSource.get(item.source.id) ?? 0;
    if (used >= 2) continue;
    perSource.set(item.source.id, used + 1);
    featured.push(item);
    if (featured.length >= limit) break;
  }

  // Si con el reparto no llegamos al mínimo, completamos con lo más reciente.
  if (featured.length < limit) {
    for (const item of all) {
      if (featured.length >= limit) break;
      if (!featured.some((existing) => existing.id === item.id)) featured.push(item);
    }
  }

  return featured;
}
