import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "./crm.module.scss";

export const metadata: Metadata = {
  title: "Contenido",
  robots: { index: false, follow: false, nocache: true },
};

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <main className={styles.shell}>{children}</main>;
}
