"use client";

import {
  Book02Icon,
  ChartHistogramIcon,
  CloudIcon,
  FavouriteIcon,
  Folder01Icon,
  Note01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import styles from "./GlassExplore.module.scss";
import GlassIcons from "./GlassIcons";
import GlassSurface from "./GlassSurface";
import { useIsAppleDevice } from "./useIsAppleDevice";

const ITEMS = [
  {
    id: "work",
    icon: <HugeiconsIcon icon={Folder01Icon} />,
    color: "blue",
    label: "Proyectos",
    href: "/work",
  },
  {
    id: "noticias",
    icon: <HugeiconsIcon icon={Note01Icon} />,
    color: "orange",
    label: "Noticias",
    href: "/noticias",
  },
  {
    id: "podcast",
    icon: <HugeiconsIcon icon={CloudIcon} />,
    color: "indigo",
    label: "Podcast",
    href: "/podcast",
  },
  {
    id: "about",
    icon: <HugeiconsIcon icon={Book02Icon} />,
    color: "purple",
    label: "Sobre mí",
    href: "/about",
  },
  {
    id: "gallery",
    icon: <HugeiconsIcon icon={ChartHistogramIcon} />,
    color: "green",
    label: "Galería",
    href: "/gallery",
  },
  {
    id: "contacto",
    icon: <HugeiconsIcon icon={FavouriteIcon} />,
    color: "red",
    label: "Contacto",
    href: "mailto:josemartinezestrada111@gmail.com",
  },
];

/**
 * Sección de accesos rápidos con acabado liquid glass. Solo se muestra en
 * iPhone, iPad y Mac; en el resto de dispositivos la web conserva su formato.
 */
export default function GlassExplore() {
  const isApple = useIsAppleDevice();

  if (!isApple) return null;

  return (
    <section className={styles.section} aria-label="Accesos rápidos">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={28}
        distortionScale={-180}
        displace={0.5}
        backgroundOpacity={0.12}
        className={styles.surface}
      >
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Accesos rápidos</p>
          <h2 className={styles.title}>Explora el sitio</h2>
          <div className={styles.icons}>
            <GlassIcons
              items={ITEMS}
              size={76}
              gap={44}
              columns={6}
              roundness={0.6}
              refraction={0.8}
              bevel={0.6}
              dispersion={0}
              frost={0.2}
              shine={0.85}
              tint="#dfdfdf"
              tintOpacity={0.2}
              iconColor="#ffffff"
              plate="tilt"
              tilt={30}
              spread={0.5}
              hover="press"
              parallax={1}
              labels="always"
              intro={true}
              theme="dark"
            />
          </div>
        </div>
      </GlassSurface>
    </section>
  );
}
