import PodcastList from "@/components/podcast/PodcastList";
import PodcastUpload from "@/components/podcast/PodcastUpload";
import { readEpisodes } from "@/lib/podcast/episodes";
import { baseURL, person, podcast } from "@/resources";
import { assertRouteEnabled } from "@/utils/route-guard";
import { Column, Heading, Meta, Schema, Text } from "@once-ui-system/core";
import Image from "next/image";

const PODCAST_COVER = "/images/apple-slices.png";

export async function generateMetadata() {
  return Meta.generate({
    title: podcast.title,
    description: podcast.description,
    baseURL: baseURL,
    image: PODCAST_COVER,
    path: podcast.path,
  });
}

/** Los episodios se leen del almacenamiento en cada visita, no en el build. */
export const dynamic = "force-dynamic";

export default async function Podcast() {
  assertRouteEnabled("/podcast");

  const episodes = await readEpisodes();

  return (
    <Column maxWidth="l" fillWidth paddingTop="24" gap="24">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={podcast.title}
        description={podcast.description}
        path={podcast.path}
        image={`${baseURL}${PODCAST_COVER}`}
        author={{
          name: person.name,
          url: `${baseURL}${podcast.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column horizontal="center" align="center" gap="16" paddingTop="8">
        <Image
          src={PODCAST_COVER}
          alt="Portada de Apple Slices"
          width={176}
          height={176}
          priority
          style={{ borderRadius: "24px", boxShadow: "0 12px 32px rgba(0,0,0,0.28)" }}
        />
      </Column>
      <Heading as="h1" variant="display-strong-s" align="center">
        {podcast.title}
      </Heading>
      <Text variant="body-default-m" onBackground="neutral-weak" align="center">
        {podcast.description}
      </Text>
      <PodcastUpload />
      <PodcastList episodes={episodes} />
    </Column>
  );
}
