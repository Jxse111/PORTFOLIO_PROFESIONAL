"use client";

import { Media, MasonryGrid } from "@once-ui-system/core";
import { useEffect, useState } from "react";
import { gallery } from "@/resources";

export default function GalleryView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <MasonryGrid columns={2} s={{ columns: 1 }}>
      {gallery.images.map((image, index) => (
        <Media
          enlarge
          priority={index < 10}
          sizes="(max-width: 768px) 100vw, 50vw"
          key={index}
          radius="m"
          aspectRatio={
            isMobile ? "4 / 3" : image.orientation === "horizontal" ? "16 / 9" : "3 / 4"
          }
          src={image.src}
          alt={image.alt}
        />
      ))}
    </MasonryGrid>
  );
}
