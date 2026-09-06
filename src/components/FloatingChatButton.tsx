"use client";

import { CHAT_ASSISTANT_NAME } from "@/resources/chat-context";
import { whatsapp } from "@/resources";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./FloatingChatButton.module.scss";

/**
 * El modal solo se descarga cuando el usuario abre el chat: así su JS no entra
 * en el bundle inicial de todas las páginas.
 */
const ChatModal = dynamic(() => import("./ChatModal"), { ssr: false });

/**
 * Botón único de contacto.
 *
 * Antes había tres accesos amontonados en la esquina inferior derecha del móvil
 * (chat flotante, WhatsApp en la barra de navegación y el propio menú). Ahora
 * un solo botón despliega las dos vías de contacto.
 */
export default function FloatingChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera o con Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const openChat = () => {
    setIsMenuOpen(false);
    setIsChatOpen(true);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`${styles.container} ${isChatOpen ? styles.hidden : ""}`}
      >
        <div className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ""}`} role="menu">
          <button type="button" className={styles.option} role="menuitem" onClick={openChat}>
            <span className={styles.optionLabel}>Preguntar al asistente</span>
            <span className={styles.optionIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10.663c0 -4.224 -4.041 -7.663 -9 -7.663s-9 3.439 -9 7.663c0 3.783 3.201 6.958 7.527 7.56c1.053 .239 .932 .644 .696 2.133c-.039 .238 -.184 .932 .777 .512c.96 -.42 5.18 -3.201 7.073 -5.48c1.304 -1.504 1.927 -3.029 1.927 -4.715v-.01z" />
              </svg>
            </span>
          </button>

          <a
            className={styles.option}
            role="menuitem"
            href={whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className={styles.optionLabel}>Escribir por WhatsApp</span>
            <span className={`${styles.optionIcon} ${styles.whatsapp}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.993 2.898 9.83 9.83 0 0 1 2.892 6.994c-.003 5.45-4.437 9.884-9.889 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
              </svg>
            </span>
          </a>
        </div>

        <button
          type="button"
          className={styles.button}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Cerrar opciones de contacto" : "Abrir opciones de contacto"}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          title={`Contacta conmigo o pregunta a ${CHAT_ASSISTANT_NAME}`}
        >
          <svg
            className={isMenuOpen ? styles.iconRotated : undefined}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isMenuOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M21 10.663c0 -4.224 -4.041 -7.663 -9 -7.663s-9 3.439 -9 7.663c0 3.783 3.201 6.958 7.527 7.56c1.053 .239 .932 .644 .696 2.133c-.039 .238 -.184 .932 .777 .512c.96 -.42 5.18 -3.201 7.073 -5.48c1.304 -1.504 1.927 -3.029 1.927 -4.715v-.01z" />
            )}
          </svg>
        </button>
      </div>

      {isChatOpen && <ChatModal onClose={() => setIsChatOpen(false)} />}
    </>
  );
}
