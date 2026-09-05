import { Meta, Schema } from "@once-ui-system/core";
import { baseURL, news, person } from "@/resources";
import { getNews } from "@/lib/news";
import NoticiasClient from "./NoticiasClient";

/**
 * Regenera la página cada 15 minutos. Next exige un literal aquí, así que este
 * valor debe mantenerse en sincronía con NEWS_REVALIDATE_SECONDS (src/lib/news/rss.ts).
 */
export const revalidate = 900;

export async function generateMetadata() {
  return Meta.generate({
    title: news.title,
    description: news.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(news.title)}`,
    path: news.path,
  });
}

export default async function Noticias() {
  const items = await getNews();

  return (
    <>
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={news.title}
        description={news.description}
        path={news.path}
        image={`/api/og/generate?title=${encodeURIComponent(news.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${news.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <NoticiasClient items={items} />
    </>
  );
}
