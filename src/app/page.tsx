import { Mailchimp } from "@/components";
import { TechStack } from "@/components/TechStack";
import { LatestNews } from "@/components/news/LatestNews";
import { LatestEpisodes } from "@/components/podcast/LatestEpisodes";
import { LatestProjects } from "@/components/work/LatestProjects";
import { about, baseURL, home, person, routes } from "@/resources";
import {
  Avatar,
  Badge,
  Button,
  Column,
  Heading,
  Meta,
  RevealFx,
  Row,
  Schema,
  Text,
} from "@once-ui-system/core";

/**
 * La portada lee el índice de episodios en cada visita: así un audio recién
 * publicado aparece en Apple Slices sin esperar a que expire la caché ISR.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL: baseURL,
    path: home.path,
    image: home.image,
  });
}

export default async function Home() {
  return (
    <Column maxWidth="m" gap="xl" paddingY="12" horizontal="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={home.path}
        title={home.title}
        description={home.description}
        image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column fillWidth horizontal="center" gap="m">
        <Column maxWidth="s" horizontal="center" align="center">
          {home.featured.display && (
            <RevealFx
              fillWidth
              horizontal="center"
              paddingTop="16"
              paddingBottom="32"
              paddingLeft="12"
            >
              <Badge
                background="brand-alpha-weak"
                paddingX="12"
                paddingY="4"
                onBackground="neutral-strong"
                textVariant="label-default-s"
                arrow={false}
                href={home.featured.href}
              >
                <Row paddingY="2">{home.featured.title}</Row>
              </Badge>
            </RevealFx>
          )}
          <RevealFx translateY="2" fillWidth horizontal="center" paddingBottom="16">
            <Heading wrap="balance" variant="display-strong-l">
              {home.headline}
            </Heading>
          </RevealFx>
          <RevealFx translateY="4" delay={0.1} fillWidth horizontal="center" paddingBottom="16">
            <Text wrap="balance" onBackground="neutral-weak" variant="heading-default-xl">
              {home.subline}
            </Text>
          </RevealFx>
          <RevealFx translateY="4" delay={0.15} fillWidth horizontal="center" paddingBottom="24">
            <Text wrap="balance" onBackground="neutral-medium" variant="body-default-m">
              {home.intro}
            </Text>
          </RevealFx>
          <RevealFx translateY="4" delay={0.2} fillWidth horizontal="center" paddingBottom="24">
            <TechStack />
          </RevealFx>
          <RevealFx paddingTop="8" delay={0.25} horizontal="center" paddingLeft="12">
            <Button
              id="about"
              data-border="rounded"
              href={about.path}
              variant="secondary"
              size="m"
              weight="default"
              arrowIcon
            >
              <Row gap="8" vertical="center" paddingRight="4">
                {about.avatar.display && (
                  <Avatar
                    marginRight="8"
                    style={{ marginLeft: "-0.75rem" }}
                    src={person.avatar}
                    size="m"
                  />
                )}
                {about.title}
              </Row>
            </Button>
          </RevealFx>
        </Column>
      </Column>
      <RevealFx translateY="8" delay={0.3}>
        <LatestProjects />
      </RevealFx>
      {routes["/podcast"] && <LatestEpisodes />}
      {routes["/noticias"] && <LatestNews />}
      <Mailchimp />
    </Column>
  );
}
