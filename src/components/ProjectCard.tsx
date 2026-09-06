"use client";

import {
  AvatarGroup,
  Carousel,
  Column,
  Flex,
  Heading,
  SmartLink,
  Text,
} from "@once-ui-system/core";
import styles from "./ProjectCard.module.scss";

interface ProjectCardProps {
  href: string;
  priority?: boolean;
  images: string[];
  title: string;
  content: string;
  description: string;
  avatars: { src: string }[];
  link: string;
  /** Tecnologías del proyecto, tal y como se declaran en el .mdx */
  technologies?: string[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  href,
  images = [],
  title,
  content,
  description,
  avatars,
  link,
  technologies = [],
}) => {
  return (
    <Column fillWidth gap="m">
      <Carousel
        sizes="(max-width: 960px) 100vw, 960px"
        items={images.map((image) => ({
          slide: image,
          alt: title,
        }))}
      />
      <Flex
        s={{ direction: "column" }}
        fillWidth
        paddingX="s"
        paddingTop="12"
        paddingBottom="24"
        gap="l"
      >
        {title && (
          <Flex flex={5}>
            <Heading as="h2" wrap="balance" variant="heading-strong-xl">
              {title}
            </Heading>
          </Flex>
        )}
        {(avatars?.length > 0 ||
          description?.trim() ||
          content?.trim() ||
          technologies.length > 0) && (
          <Column flex={7} gap="16">
            {avatars?.length > 0 && <AvatarGroup avatars={avatars} size="m" reverse />}
            {technologies.length > 0 && (
              <ul className={styles.techList} aria-label={`Tecnologías de ${title}`}>
                {technologies.map((tech) => (
                  <li key={tech} className={styles.techItem}>
                    {tech}
                  </li>
                ))}
              </ul>
            )}
            {description?.trim() && (
              <Text wrap="balance" variant="body-default-s" onBackground="neutral-weak">
                {description}
              </Text>
            )}
            <Flex gap="24" wrap>
              {content?.trim() && (
                <SmartLink
                  suffixIcon="arrowRight"
                  // Área pulsable cómoda en móvil: el enlace medía 17px de alto.
                  style={{ margin: "0", width: "fit-content", minHeight: "44px" }}
                  href={href}
                >
                  <Text variant="body-default-s">Ver el proyecto en detalle</Text>
                </SmartLink>
              )}
              {link && (
                <SmartLink
                  suffixIcon="arrowUpRightFromSquare"
                  style={{ margin: "0", width: "fit-content", minHeight: "44px" }}
                  href={link}
                >
                  <Text variant="body-default-s">Visitar la web</Text>
                </SmartLink>
              )}
            </Flex>
          </Column>
        )}
      </Flex>
    </Column>
  );
};
