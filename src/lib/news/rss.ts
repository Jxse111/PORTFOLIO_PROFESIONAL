import { XMLParser } from "fast-xml-parser";
import type { NewsSource } from "./sources";
import type { NewsItem } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  // Algunas descripciones vienen como CDATA con HTML dentro.
  processEntities: true,
});

const FETCH_TIMEOUT_MS = 8000;
/** Tope de items por feed: algunos publican cientos de entradas históricas. */
const MAX_ITEMS_PER_FEED = 30;
/** Tiempo de cacheado de cada feed (15 min). */
export const NEWS_REVALIDATE_SECONDS = 900;

/** Devuelve siempre un array, tanto si el XML trae 1 elemento como si trae N. */
function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Extrae el texto plano de un nodo que puede ser string, número u objeto. */
function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (typeof record["#text"] === "string") return record["#text"];
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

/** Busca una imagen de portada en los distintos sitios donde la ponen los feeds. */
function extractImage(entry: Record<string, unknown>): string | undefined {
  const candidates: unknown[] = [
    entry["media:content"],
    entry["media:thumbnail"],
    entry.enclosure,
    entry["image"],
  ];

  for (const candidate of candidates) {
    for (const node of toArray(candidate)) {
      if (typeof node === "string" && node.startsWith("http")) return node;
      if (node && typeof node === "object") {
        const record = node as Record<string, unknown>;
        const url = record["@_url"] ?? record["url"];
        const type = String(record["@_type"] ?? "");
        if (typeof url === "string" && url.startsWith("http")) {
          if (type && !type.startsWith("image")) continue;
          return url;
        }
      }
    }
  }

  // Atom: <link rel="enclosure" type="image/..." href="..." />
  for (const link of toArray(entry.link)) {
    if (link && typeof link === "object") {
      const record = link as Record<string, unknown>;
      if (
        record["@_rel"] === "enclosure" &&
        String(record["@_type"] ?? "").startsWith("image") &&
        typeof record["@_href"] === "string"
      ) {
        return record["@_href"];
      }
    }
  }

  // Último recurso: primer <img> dentro del cuerpo del item.
  const body = `${textOf(entry["content:encoded"])}${textOf(entry.description)}${textOf(entry.content)}`;
  const match = body.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]?.startsWith("http")) return match[1];

  return undefined;
}

/** Resuelve el href de un item, cubriendo RSS 2.0 y Atom. */
function extractLink(entry: Record<string, unknown>): string | undefined {
  const links = toArray(entry.link);

  for (const link of links) {
    if (typeof link === "string" && link.startsWith("http")) return link;
    if (link && typeof link === "object") {
      const record = link as Record<string, unknown>;
      const rel = record["@_rel"];
      const href = record["@_href"];
      if ((rel === undefined || rel === "alternate") && typeof href === "string") return href;
    }
  }

  const guid = textOf(entry.guid);
  return guid.startsWith("http") ? guid : undefined;
}

function extractDate(entry: Record<string, unknown>): string | undefined {
  const raw =
    textOf(entry.pubDate) ||
    textOf(entry.published) ||
    textOf(entry.updated) ||
    textOf(entry["dc:date"]);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Id estable a partir del enlace, para poder deduplicar entre fuentes. */
function makeId(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .slice(0, 120);
}

/**
 * Descarga y normaliza un feed. Nunca lanza: si la fuente falla, devuelve [].
 */
export async function fetchFeed(source: NewsSource): Promise<NewsItem[]> {
  let xml: string;

  try {
    const response = await fetch(source.url, {
      headers: {
        // Algunos feeds rechazan peticiones sin User-Agent.
        "User-Agent": "Mozilla/5.0 (compatible; jxse.site/1.0; +https://www.jxse.site)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: NEWS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.warn(`[news] ${source.id}: HTTP ${response.status}`);
      return [];
    }

    xml = await response.text();
  } catch (error) {
    console.warn(`[news] ${source.id}: fallo de red`, error);
    return [];
  }

  try {
    const parsed = parser.parse(xml) as Record<string, any>;
    const entries: Record<string, unknown>[] =
      toArray(parsed?.rss?.channel?.item) // RSS 2.0
        .concat(toArray(parsed?.feed?.entry)) // Atom
        .concat(toArray(parsed?.["rdf:RDF"]?.item)); // RSS 1.0

    return entries.slice(0, MAX_ITEMS_PER_FEED).flatMap((entry) => {
      const url = extractLink(entry);
      const title = stripHtml(textOf(entry.title));
      const publishedAt = extractDate(entry);

      if (!url || !title || !publishedAt) return [];

      const rawSummary =
        textOf(entry.description) || textOf(entry.summary) || textOf(entry["content:encoded"]);

      return [
        {
          id: makeId(url),
          title,
          summary: truncate(stripHtml(rawSummary)),
          url,
          image: extractImage(entry),
          publishedAt,
          category: source.category,
          source: { id: source.id, name: source.name, domain: source.domain },
        },
      ];
    });
  } catch (error) {
    console.warn(`[news] ${source.id}: XML inválido`, error);
    return [];
  }
}
