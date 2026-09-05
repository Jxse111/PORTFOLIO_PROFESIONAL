"use client";

import { CHAT_ASSISTANT_NAME } from "@/resources/chat-context";
import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./FloatingChatButton.module.scss";

/**
 * El modal solo se descarga cuando el usuario abre el chat: así su JS no entra
 * en el bundle inicial de todas las páginas.
 */
const ChatModal = dynamic(() => import("./ChatModal"), { ssr: false });

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${isOpen ? styles.hidden : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label={`Abrir chat con ${CHAT_ASSISTANT_NAME}`}
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 10.663c0 -4.224 -4.041 -7.663 -9 -7.663s-9 3.439 -9 7.663c0 3.783 3.201 6.958 7.527 7.56c1.053 .239 .932 .644 .696 2.133c-.039 .238 -.184 .932 .777 .512c.96 -.42 5.18 -3.201 7.073 -5.48c1.304 -1.504 1.927 -3.029 1.927 -4.715v-.01z" />
        </svg>
      </button>

      {isOpen && <ChatModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
