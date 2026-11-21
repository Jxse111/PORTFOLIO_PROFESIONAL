import { work } from "@/resources";
import { getPosts } from "@/utils/utils";
import { Button, Column, Heading, Line, Row, Text } from "@once-ui-system/core";
import Image from "next/image";
import styles from "./LatestProjects.module.scss";

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function summaryFor(post: ReturnType<typeof getPosts>[number]): string {
  if (post.metadata.summary.trim()) return post.metadata.summary;

  const technologies = post.metadata.technologies ?? [];
  if (technologies.length > 0) {
    return `Proyecto web desarrollado con ${technologies.slice(0, 3).join(", ")}.`;
  }

  return "Proyecto web desarrollado por José Martínez Estrada.";
}

/**
 * Bloque de portada con los tres proyectos más recientes. Cada tarjeta muestra
 * la fecha de publicación para que el orden por novedad sea evidente.
 */
export function LatestProjects() {
  const projects = getPosts(["src", "app", "work", "projects"])
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime(),
    )
    .slice(0, 3);

  if (projects.length === 0) return null;

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
            Proyectos recientes
          </Heading>
          <Text variant="body-default-s" onBackground="neutral-weak" wrap="balance">
            Los últimos trabajos publicados, ordenados por fecha.
          </Text>
        </Column>
        <Button href={work.path} variant="tertiary" size="s" data-border="rounded" arrowIcon>
          Ver todos los proyectos
        </Button>
      </Row>

      <Row fillWidth paddingX="l">
        <div className={styles.grid}>
          {projects.map((post) => {
            const cover = post.metadata.images[0] || "/images/og/home.jpg";
            const technologies = post.metadata.technologies ?? [];

            return (
              <a
                key={post.slug}
                href={`/work/${post.slug}`}
                className={styles.card}
                aria-label={`Ver el proyecto ${post.metadata.title}`}
              >
                <div className={styles.thumbWrapper}>
                  <Image
                    className={styles.thumb}
                    src={cover}
                    alt=""
                    width={640}
                    height={360}
                    loading="lazy"
                  />
                </div>

                <div className={styles.body}>
                  <Text className={styles.meta} onBackground="brand-medium">
                    {formatDate(post.metadata.publishedAt)}
                  </Text>
                  <Text className={styles.title} variant="heading-strong-m" wrap="balance">
                    {post.metadata.title}
                  </Text>
                  <Text
                    className={styles.summary}
                    variant="body-default-s"
                    onBackground="neutral-weak"
                  >
                    {summaryFor(post)}
                  </Text>

                  {technologies.length > 0 && (
                    <ul
                      className={styles.techList}
                      aria-label={`Tecnologías de ${post.metadata.title}`}
                    >
                      {technologies.slice(0, 4).map((tech) => (
                        <li key={tech} className={styles.techItem}>
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}

                  <span className={styles.action}>Ver el proyecto →</span>
                </div>
              </a>
            );
          })}
        </div>
      </Row>

      <Row fillWidth paddingLeft="64" horizontal="end">
        <Line maxWidth={48} />
      </Row>
    </Column>
  );
}

export default LatestProjects;
