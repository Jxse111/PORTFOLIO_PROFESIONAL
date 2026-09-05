"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@once-ui-system/core";
import type { NewsItem } from "@/lib/news/types";
import { NewsCard } from "./NewsCard";
import styles from "./NewsCarousel.module.scss";

interface NewsCarouselProps {
  items: NewsItem[];
}

export function NewsCarousel({ items }: NewsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft >= maxScroll - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // Avanza aproximadamente una tarjeta y su separación.
    const step = (track.querySelector(`.${styles.slide}`)?.clientWidth ?? 320) + 16;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        aria-label="Noticias anteriores"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={() => scrollBy(-1)}
        disabled={atStart}
      >
        <Icon name="chevronLeft" size="s" />
      </button>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={updateArrows}
        role="region"
        aria-label="Carrusel de últimas noticias"
      >
        {items.map((item) => (
          <div key={item.id} className={styles.slide}>
            <NewsCard item={item} showSummary={false} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Noticias siguientes"
        className={`${styles.arrow} ${styles.next}`}
        onClick={() => scrollBy(1)}
        disabled={atEnd}
      >
        <Icon name="chevronRight" size="s" />
      </button>
    </div>
  );
}

export default NewsCarousel;
