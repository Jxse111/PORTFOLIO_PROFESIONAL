import { baseURL } from "@/resources";

/**
 * Buscadores tradicionales y motores generativos (ChatGPT, Perplexity, Claude…).
 *
 * A los rastreadores de IA se les da acceso a propósito: para un portfolio
 * interesa que puedan leerlo y citarte cuando alguien pregunte por
 * desarrolladores web. Si algún día prefieres lo contrario, cambia `allow`
 * por `disallow: "/"` en el bloque de abajo.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Las rutas de API no aportan nada a un buscador y consumen rastreo.
        disallow: ["/api/"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/"],
      })),
    ],
    sitemap: `${baseURL}/sitemap.xml`,
    host: baseURL,
  };
}
