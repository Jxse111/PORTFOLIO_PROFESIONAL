/**
 * Fuentes RSS de la sección de noticias.
 *
 * Solo se muestran titular, resumen breve, imagen de portada y enlace a la
 * fuente original: nunca se reproduce el artículo completo.
 */

export type NewsCategory = "apple" | "ia" | "tecnologia";

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  /** Dominio usado para el favicon de la fuente. */
  domain: string;
}

export const NEWS_CATEGORIES: { id: NewsCategory; label: string; icon: string }[] = [
  { id: "apple", label: "Apple", icon: "apple" },
  { id: "ia", label: "Inteligencia Artificial", icon: "sparkles" },
  { id: "tecnologia", label: "Tecnología", icon: "chip" },
];

export const NEWS_SOURCES: NewsSource[] = [
  // Apple
  {
    id: "apple-newsroom",
    name: "Apple Newsroom",
    url: "https://www.apple.com/es/newsroom/rss-feed.rss",
    category: "apple",
    domain: "apple.com",
  },
  {
    id: "applesfera",
    name: "Applesfera",
    url: "https://www.applesfera.com/feedburner.xml",
    category: "apple",
    domain: "applesfera.com",
  },
  {
    id: "9to5mac",
    name: "9to5Mac",
    url: "https://9to5mac.com/feed/",
    category: "apple",
    domain: "9to5mac.com",
  },

  // Inteligencia Artificial
  {
    id: "openai",
    name: "OpenAI",
    url: "https://openai.com/news/rss.xml",
    category: "ia",
    domain: "openai.com",
  },
  {
    id: "deepmind",
    name: "Google DeepMind",
    url: "https://deepmind.google/blog/rss.xml",
    category: "ia",
    domain: "deepmind.google",
  },
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ia",
    domain: "techcrunch.com",
  },

  // Tecnología general
  {
    id: "xataka",
    name: "Xataka",
    url: "https://www.xataka.com/feedburner.xml",
    category: "tecnologia",
    domain: "xataka.com",
  },
  {
    id: "genbeta",
    name: "Genbeta",
    url: "https://www.genbeta.com/feedburner.xml",
    category: "tecnologia",
    domain: "genbeta.com",
  },
  {
    id: "wired-es",
    name: "WIRED en Español",
    url: "https://es.wired.com/feed/rss",
    category: "tecnologia",
    domain: "es.wired.com",
  },
  {
    id: "arstechnica",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    category: "tecnologia",
    domain: "arstechnica.com",
  },
];
