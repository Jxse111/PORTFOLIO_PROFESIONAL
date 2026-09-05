"use client";

import {
  CHAT_ASSISTANT_NAME,
  CHAT_SUGGESTIONS,
  CHAT_WELCOME_MESSAGE,
} from "@/resources/chat-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMarkdown } from "./ChatMarkdown";
import styles from "./ChatModal.module.scss";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  isError?: boolean;
}

interface ChatModalProps {
  onClose: () => void;
}

const STORAGE_KEY = "portfolio_chat_messages";
const MAX_LENGTH = 1000;

const WELCOME: Message = {
  id: "welcome",
  role: "model",
  text: CHAT_WELCOME_MESSAGE,
};

export default function ChatModal({ onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* --- Persistencia en la sesión --- */

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // sessionStorage lleno o bloqueado: el chat sigue funcionando sin persistir.
    }
  }, [messages]);

  /* --- Scroll automático --- */

  // No se leen dentro, pero son justo los cambios que deben disparar el scroll.
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencias intencionadas
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText]);

  /* --- Foco inicial, Escape y bloqueo del scroll de fondo --- */

  useEffect(() => {
    textareaRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      abortRef.current?.abort();
    };
  }, [onClose]);

  /* --- Envío --- */

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isLoading) return;

      const userMessage: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      };

      // El historial que enviamos excluye el saludo y los mensajes de error.
      const history = messages
        .filter((m) => m.id !== "welcome" && !m.isError)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setStreamingText("");
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "El asistente no está disponible ahora mismo.");
        }
        if (!response.body) throw new Error("Respuesta vacía del asistente.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setStreamingText(accumulated);
        }

        if (!accumulated.trim()) {
          throw new Error("No he podido generar una respuesta. Prueba a reformular la pregunta.");
        }

        setMessages((prev) => [
          ...prev,
          { id: `m-${Date.now()}`, role: "model", text: accumulated },
        ]);
      } catch (error) {
        if (controller.signal.aborted) return;

        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "model",
            text: error instanceof Error ? error.message : "Ha ocurrido un error inesperado.",
            isError: true,
          },
        ]);
      } finally {
        if (!controller.signal.aborted) {
          setStreamingText("");
          setIsLoading(false);
          abortRef.current = null;
          textareaRef.current?.focus();
        }
      }
    },
    [isLoading, messages],
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value.slice(0, MAX_LENGTH));
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envía; Shift+Enter hace salto de línea.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const resetConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setStreamingText("");
    setMessages([WELCOME]);
    sessionStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  };

  const showSuggestions = messages.length === 1 && !isLoading;

  return (
    <div className={styles.overlay}>
      {/* Botón real en lugar de un div con onClick: así cerrar al pulsar fuera
          también funciona con teclado y lectores de pantalla. */}
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label="Cerrar chat"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        className={styles.panel}
        // biome-ignore lint/a11y/useSemanticElements: <dialog> nativo abriría con
        // showModal() y su propio backdrop, incompatible con esta ventana anclada.
        role="dialog"
        aria-modal="true"
        aria-label={`Chat con ${CHAT_ASSISTANT_NAME}`}
      >
        <header className={styles.header}>
          <div className={styles.avatar} aria-hidden="true">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 3a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-4.724l-4.762 2.857a1 1 0 0 1 -1.508 -.743l-.006 -.114v-2h-1a4 4 0 0 1 -3.995 -3.8l-.005 -.2v-8a4 4 0 0 1 4 -4zm-2.8 9.286a1 1 0 0 0 -1.414 .014a2.5 2.5 0 0 1 -3.572 0a1 1 0 0 0 -1.428 1.4a4.5 4.5 0 0 0 6.428 0a1 1 0 0 0 -.014 -1.414m-5.69 -4.286h-.01a1 1 0 1 0 0 2h.01a1 1 0 0 0 0 -2m5 0h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2" />
            </svg>
          </div>

          <div className={styles.headerText}>
            <h2 className={styles.headerTitle}>{CHAT_ASSISTANT_NAME}</h2>
            <span className={styles.headerStatus}>
              {isLoading ? (
                "escribiendo…"
              ) : (
                <>
                  <span className={styles.statusDot} aria-hidden="true" />
                  En línea
                </>
              )}
            </span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={resetConversation}
              aria-label="Reiniciar conversación"
              title="Reiniciar conversación"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Cerrar chat"
              title="Cerrar"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6l-12 12M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div
          className={styles.messages}
          ref={messagesRef}
          role="log"
          aria-live="polite"
          aria-label="Mensajes de la conversación"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.row} ${styles[msg.role]}`}>
              <div className={`${styles.bubble} ${msg.isError ? styles.errorBubble : ""}`}>
                <ChatMarkdown text={msg.text} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.row} ${styles.model}`}>
              <div className={styles.bubble}>
                {streamingText ? (
                  <>
                    <ChatMarkdown text={streamingText} />
                    <span className={styles.caret} aria-hidden="true" />
                  </>
                ) : (
                  <div className={styles.typing} aria-label="Escribiendo">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showSuggestions && (
          <div className={styles.suggestions}>
            {CHAT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.suggestion}
                onClick={() => send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className={styles.inputArea}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje…"
            rows={1}
            maxLength={MAX_LENGTH}
            disabled={isLoading}
            aria-label="Escribe tu mensaje"
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={() => send(input)}
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensaje"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 14l11 -11" />
              <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
            </svg>
          </button>
        </div>

        <p className={styles.disclaimer}>
          Asistente con IA. Puede equivocarse: para temas serios, escribe directamente.
        </p>
      </div>
    </div>
  );
}
