import { Column, Row, Heading, Text, Line, Button } from "@once-ui-system/core";
import { getFeaturedNews } from "@/lib/news";
import { news } from "@/resources";
import { NewsCarousel } from "./NewsCarousel";

/**
 * Bloque de portada: carrusel con las noticias más recientes de todas las
 * categorías. Si ninguna fuente responde, no se renderiza nada.
 */
export async function LatestNews() {
  const items = await getFeaturedNews(10);

  if (items.length === 0) return null;

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
            Últimas noticias
          </Heading>
          <Text variant="body-default-s" onBackground="neutral-weak" wrap="balance">
            Apple, inteligencia artificial y tecnología, al minuto.
          </Text>
        </Column>
        <Button href={news.path} variant="tertiary" size="s" data-border="rounded" arrowIcon>
          Ver todas
        </Button>
      </Row>

      <Row fillWidth paddingX="l">
        <NewsCarousel items={items} />
      </Row>

      <Row fillWidth paddingLeft="64" horizontal="end">
        <Line maxWidth={48} />
      </Row>
    </Column>
  );
}

export default LatestNews;
