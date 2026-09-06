"use client";

import { usePathname } from "next/navigation";
import styles from "./PageTransition.module.scss";

/**
 * Desvanecido corto al cambiar de sección.
 *
 * La `key` con la ruta hace que la animación se reinicie en cada navegación.
 * Se respeta `prefers-reduced-motion` para quien tenga el movimiento reducido.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={styles.wrapper}>
      {children}
    </div>
  );
}

export default PageTransition;
