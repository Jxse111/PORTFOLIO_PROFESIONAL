"use client";

import { Column, Row, Text, Badge, Icon } from "@once-ui-system/core";
import type { NewsItem } from "@/lib/news/types";
import { formatRelativeDate, isBreaking } from "@/lib/news/format";
import styles from "./NewsCard.module.scss";

interface NewsCardProps {
  item: NewsItem;
  /** Oculta el resumen (útil en el carrusel, donde manda el titular). */
  showSummary?: boolean;
  /**
   * Activa la disposición compacta en móvil (imagen a la izquierda). Se usa en
   * la rejilla de /noticias; el carrusel mantiene la tarjeta vertical.
   */
  compactOnMobile?: boolean;
}

function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function NewsCard({ item, showSummary = true, compactOnMobile = false }: NewsCardProps) {
  const breaking = isBreaking(item.publishedAt);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`${styles.card} ${compactOnMobile ? styles.compactOnMobile : ""}`}
    >
      <div className={styles.thumbWrapper}>
        {item.image ? (
          // Las portadas llegan de dominios de terceros arbitrarios, por lo que no
          // se pueden pasar por next/image sin listar cada host en next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.thumb}
            src={item.image}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.thumbFallback}>
            <Icon name="newspaper" size="l" onBackground="brand-medium" />
          </div>
        )}
      </div>

      <Column
        fillWidth
        flex={1}
        gap="8"
        padding="16"
        vertical="start"
      >
        <Row gap="8" vertical="center" wrap className={styles.meta}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.favicon}
            src={faviconUrl(item.source.domain)}
            alt=""
            loading="lazy"
            width={16}
            height={16}
          />
          <Text variant="label-default-s" onBackground="neutral-weak">
            {item.source.name}
          </Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            · {formatRelativeDate(item.publishedAt)}
          </Text>
          {breaking && (
            <Badge
              background="brand-alpha-weak"
              onBackground="brand-strong"
              textVariant="label-strong-s"
              paddingX="8"
              paddingY="2"
              arrow={false}
            >
              Última hora
            </Badge>
          )}
        </Row>

        <Text
          variant="heading-strong-s"
          wrap="balance"
          className={styles.title}
        >
          {item.title}
        </Text>

        {showSummary && item.summary && (
          <Text variant="body-default-s" onBackground="neutral-weak" className={styles.summary}>
            {item.summary}
          </Text>
        )}
      </Column>
    </a>
  );
}

export default NewsCard;
