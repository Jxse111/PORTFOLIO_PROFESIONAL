import type { ReactNode } from "react";
import { Fragment } from "react";

/**
 * Renderizador de markdown mínimo para las respuestas del chat.
 * Soporta **negrita**, *cursiva*, `código`, [enlaces](url), listas y saltos de línea.
 *
 * Se construye con nodos de React (nunca con dangerouslySetInnerHTML), así que
 * el texto que devuelve el modelo no puede inyectar HTML en la página.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      // Solo permitimos esquemas seguros; nada de javascript: ni data:.
      const safe = /^(https?:\/\/|mailto:|\/)/i.test(href);
      if (!safe) return <Fragment key={key}>{label}</Fragment>;

      const external = href.startsWith("http");
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul key={`ul-${key}`}>
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: líneas de texto estáticas ya renderizadas
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
  };

  const lines = text.split("\n");

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);

    if (bullet) {
      listItems.push(bullet[1]);
      return;
    }

    flushList(String(i));

    if (trimmed) {
      blocks.push(
        // El bloque se regenera entero en cada render a partir del texto.
        // biome-ignore lint/suspicious/noArrayIndexKey: sin estado por elemento que preservar
        <p key={`p-${i}`}>{renderInline(trimmed, String(i))}</p>,
      );
    }
  });

  flushList("end");

  return <>{blocks}</>;
}
