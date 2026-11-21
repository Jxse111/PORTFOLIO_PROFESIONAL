import { readEpisodes, sortByRecentlyAdded } from "@/lib/podcast/episodes";
import { podcast } from "@/resources";
import { Button, Column, Heading, Line, Row, Text } from "@once-ui-system/core";
import Image from "next/image";
import styles from "./LatestEpisodes.module.scss";

const COVER = "/images/apple-slices.png";

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes} min ${rest} s`;
}

/**
 * Bloque de portada para Apple Slices: los tres últimos episodios, con portada,
 * fecha y duración. Si aún no hay episodios, la sección no se renderiza.
 */
export async function LatestEpisodes() {
  const episodes = await readEpisodes();
  if (episodes.length === 0) return null;

  const latest = sortByRecentlyAdded(episodes).slice(0, 3);

  return (
    <Column fillWidth gap="24" marginBottom="l">
      <Row fillWidth paddingRight="64">
        <Line maxWidth={48} />
      </Row>

      <Row
        fillWidth
        paddingX="l"
        paddingTop="24"
        gap="16"
        vertical="end"
        s={{ direction: "column", align: "start" }}
      >
        <Column gap="8" flex={1}>
          <Heading as="h2" variant="display-strong-xs" wrap="balance">
            Apple Slices
          </Heading>
          <Text variant="body-default-s" onBackground="neutral-weak" wrap="balance">
            Trozos de actualidad sobre Apple, IA y desarrollo, grabados paseando junto al mar.
          </Text>
        </Column>
        <Button href={podcast.path} variant="tertiary" size="s" data-border="rounded" arrowIcon>
          Ver todos los episodios
        </Button>
      </Row>

      <Row fillWidth paddingX="l">
        <div className={styles.grid}>
          {latest.map((episode) => (
            <a
              key={episode.id}
              href={`${podcast.path}#${episode.id}`}
              className={styles.card}
              aria-label={`Escuchar ${episode.title}`}
            >
              <Image
                className={styles.cover}
                src={COVER}
                alt=""
                width={112}
                height={112}
                loading="lazy"
              />
              <Column fillWidth gap="8" vertical="start">
                <Row gap="8" vertical="center" wrap>
                  <Text variant="label-default-s" onBackground="brand-medium">
                    {formatDate(episode.publishedAt)}
                  </Text>
                  {episode.durationSeconds > 0 && (
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      · {formatDuration(episode.durationSeconds)}
                    </Text>
                  )}
                </Row>
                <Text variant="heading-strong-s" wrap="balance" className={styles.title}>
                  {episode.title}
                </Text>
                {episode.description && (
                  <Text
                    variant="body-default-s"
                    onBackground="neutral-weak"
                    className={styles.description}
                  >
                    {episode.description}
                  </Text>
                )}
                <span className={styles.action}>Escuchar episodio →</span>
              </Column>
            </a>
          ))}
        </div>
      </Row>

      <Row fillWidth paddingLeft="64" horizontal="end">
        <Line maxWidth={48} />
      </Row>
    </Column>
  );
}

export default LatestEpisodes;
