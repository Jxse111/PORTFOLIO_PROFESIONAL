"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Column, Row, Heading, Text, Button, Icon } from "@once-ui-system/core";
import { NewsCard } from "@/components/news/NewsCard";
import { NEWS_CATEGORIES, type NewsCategory } from "@/lib/news/sources";
import type { NewsItem } from "@/lib/news/types";
import styles from "./NoticiasClient.module.scss";

const PAGE_SIZE = 12;

interface NoticiasClientProps {
  items: NewsItem[];
}

type Filter = NewsCategory | "todas";

export default function NoticiasClient({ items }: NoticiasClientProps) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsAtEnd, setTabsAtEnd] = useState(false);

  // Oculta el degradado del borde cuando ya no queda nada por desplazar.
  const updateTabsFade = useCallback(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const maxScroll = tabs.scrollWidth - tabs.clientWidth;
    setTabsAtEnd(maxScroll <= 4 || tabs.scrollLeft >= maxScroll - 4);
  }, []);

  useEffect(() => {
    updateTabsFade();
    window.addEventListener("resize", updateTabsFade);
    return () => window.removeEventListener("resize", updateTabsFade);
  }, [updateTabsFade]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "todas" && item.category !== filter) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.summary.toLowerCase().includes(needle) ||
        item.source.name.toLowerCase().includes(needle)
      );
    });
  }, [items, filter, query]);

  const shown = filtered.slice(0, visible);

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setVisible(PAGE_SIZE);
  };

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["todas", items.length]]);
    for (const category of NEWS_CATEGORIES) {
      map.set(category.id, items.filter((item) => item.category === category.id).length);
    }
    return map;
  }, [items]);

  return (
    <Column maxWidth="l" gap="l" paddingY="24" horizontal="center" fillWidth>
      <Column maxWidth="s" horizontal="center" align="center" gap="16" paddingBottom="8">
        <Heading variant="display-strong-m" wrap="balance">
          Noticias
        </Heading>
        <Text variant="heading-default-m" onBackground="neutral-weak" wrap="balance">
          Lo último de Apple, inteligencia artificial y tecnología, reunido en un solo sitio y
          actualizado automáticamente.
        </Text>
      </Column>

      <Column fillWidth gap="16" className={styles.filters} paddingY="12">
        <input
          className={styles.searchInput}
          type="search"
          value={query}
          placeholder="Buscar por titular, tema o fuente…"
          aria-label="Buscar noticias"
          onChange={(event) => {
            setQuery(event.target.value);
            setVisible(PAGE_SIZE);
          }}
        />

        <div className={`${styles.tabWrapper} ${tabsAtEnd ? styles.atEnd : ""}`}>
          <div className={styles.tabScroller} ref={tabsRef} onScroll={updateTabsFade}>
            <button
              type="button"
              className={`${styles.tab} ${filter === "todas" ? styles.tabActive : ""}`}
              onClick={() => changeFilter("todas")}
              aria-pressed={filter === "todas"}
            >
              <Icon name="fire" size="xs" />
              Todas ({counts.get("todas") ?? 0})
            </button>
            {NEWS_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.tab} ${filter === category.id ? styles.tabActive : ""}`}
                onClick={() => changeFilter(category.id)}
                aria-pressed={filter === category.id}
              >
                <Icon name={category.icon} size="xs" />
                {category.label} ({counts.get(category.id) ?? 0})
              </button>
            ))}
          </div>
        </div>
      </Column>

      {shown.length === 0 ? (
        <Column fillWidth horizontal="center" align="center" gap="12" paddingY="64">
          <Icon name="newspaper" size="l" onBackground="neutral-weak" />
          <Text variant="body-default-m" onBackground="neutral-weak">
            No hay noticias que coincidan con tu búsqueda.
          </Text>
        </Column>
      ) : (
        <div className={styles.grid}>
          {shown.map((item) => (
            <NewsCard key={item.id} item={item} compactOnMobile />
          ))}
        </div>
      )}

      {visible < filtered.length && (
        <Row fillWidth horizontal="center" paddingY="24">
          <Button
            variant="secondary"
            size="m"
            data-border="rounded"
            onClick={() => setVisible((current) => current + PAGE_SIZE)}
          >
            Ver más noticias
          </Button>
        </Row>
      )}

      <Text variant="body-default-xs" onBackground="neutral-weak" align="center" paddingY="16">
        Titulares y resúmenes proceden de sus medios originales. Haz clic en cualquier noticia para
        leerla completa en la fuente.
      </Text>
    </Column>
  );
}
