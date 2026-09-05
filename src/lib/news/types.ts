import type { NewsCategory } from "./sources";

export interface NewsItem {
  /** Identificador estable derivado del enlace original. */
  id: string;
  title: string;
  summary: string;
  /** Enlace al artículo original en la fuente. */
  url: string;
  image?: string;
  /** Fecha de publicación en ISO 8601. */
  publishedAt: string;
  category: NewsCategory;
  source: {
    id: string;
    name: string;
    domain: string;
  };
}
