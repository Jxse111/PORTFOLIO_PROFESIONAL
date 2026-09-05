"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Column, Row, Text, Icon, Heading } from "@once-ui-system/core";
import styles from "./GalleryUpload.module.scss";

type Step = "closed" | "email" | "code" | "upload";

interface QueuedFile {
  file: File;
  previewUrl: string;
  alt: string;
  orientation: "horizontal" | "vertical";
  status: "pendiente" | "subiendo" | "listo" | "error";
  error?: string;
}

/** Lee las dimensiones para deducir si la foto es apaisada o vertical. */
function readOrientation(file: File): Promise<"horizontal" | "vertical"> {
  return new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image.width >= image.height ? "horizontal" : "vertical");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("horizontal");
    };
    image.src = url;
  });
}

export default function GalleryUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("closed");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "info" } | null>(null);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStep("closed");
    setCode("");
    setQueue([]);
    setMessage(null);
  };

  const requestCode = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/gallery/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "No se pudo enviar el código");
      }
      setStep("code");
      setMessage({
        text: "Si el correo es el autorizado, recibirás un código en un minuto.",
        kind: "info",
      });
    } catch (error) {
      setMessage({ text: (error as Error).message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/gallery/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "Código incorrecto");
      }
      setStep("upload");
    } catch (error) {
      setMessage({ text: (error as Error).message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const added = await Promise.all(
      Array.from(files).map(async (file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        alt: "",
        orientation: await readOrientation(file),
        status: "pendiente" as const,
      })),
    );
    setQueue((current) => [...current, ...added]);
  };

  const updateAlt = (index: number, alt: string) => {
    setQueue((current) => current.map((item, i) => (i === index ? { ...item, alt } : item)));
  };

  const removeFile = (index: number) => {
    setQueue((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  const uploadAll = async () => {
    const sinDescripcion = queue.some((item) => item.status !== "listo" && item.alt.trim().length < 3);
    if (sinDescripcion) {
      setMessage({
        text: "Describe cada imagen: es lo que leen los lectores de pantalla y Google.",
        kind: "error",
      });
      return;
    }

    setBusy(true);
    setMessage(null);
    let subidas = 0;

    for (let index = 0; index < queue.length; index++) {
      if (queue[index].status === "listo") continue;

      setQueue((current) =>
        current.map((item, i) => (i === index ? { ...item, status: "subiendo" } : item)),
      );

      const item = queue[index];
      const form = new FormData();
      form.append("file", item.file);
      form.append("alt", item.alt);
      form.append("orientation", item.orientation);

      try {
        const response = await fetch("/api/gallery/upload", { method: "POST", body: form });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message ?? "Error al subir");
        }
        subidas++;
        setQueue((current) =>
          current.map((entry, i) => (i === index ? { ...entry, status: "listo" } : entry)),
        );
      } catch (error) {
        setQueue((current) =>
          current.map((entry, i) =>
            i === index ? { ...entry, status: "error", error: (error as Error).message } : entry,
          ),
        );
      }
    }

    setBusy(false);

    if (subidas > 0) {
      setMessage({
        text: `${subidas} ${subidas === 1 ? "imagen subida" : "imágenes subidas"}. Ya aparecen en la galería.`,
        kind: "info",
      });
      router.refresh();
    }
  };

  if (step === "closed") {
    return (
      <Row fillWidth horizontal="center" paddingY="16">
        <Button
          variant="secondary"
          size="s"
          data-border="rounded"
          prefixIcon="plus"
          onClick={() => setStep("email")}
        >
          Subir imágenes
        </Button>
      </Row>
    );
  }

  return (
    <Column
      className={styles.panel}
      background="surface"
      border="neutral-alpha-weak"
      radius="l"
      padding="24"
      gap="16"
      marginY="16"
    >
      <Row fillWidth horizontal="between" vertical="center">
        <Heading as="h2" variant="heading-strong-s">
          {step === "upload" ? "Añadir imágenes" : "Verifica que eres tú"}
        </Heading>
        <Button variant="tertiary" size="s" onClick={reset}>
          Cerrar
        </Button>
      </Row>

      {step === "email" && (
        <>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Te enviaremos un código de un solo uso al correo autorizado.
          </Text>
          <input
            className={styles.input}
            type="email"
            value={email}
            placeholder="tu@correo.com"
            aria-label="Correo electrónico"
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && email.includes("@") && requestCode()}
          />
          <Button
            variant="primary"
            size="m"
            data-border="rounded"
            disabled={busy || !email.includes("@")}
            onClick={requestCode}
          >
            {busy ? "Enviando…" : "Enviarme el código"}
          </Button>
        </>
      )}

      {step === "code" && (
        <>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Introduce el código de 8 caracteres que has recibido. Caduca en 10 minutos.
          </Text>
          <input
            className={`${styles.input} ${styles.code}`}
            type="text"
            value={code}
            maxLength={8}
            placeholder="········"
            aria-label="Código de verificación"
            autoComplete="one-time-code"
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === "Enter" && code.length === 8 && verifyCode()}
          />
          <Button
            variant="primary"
            size="m"
            data-border="rounded"
            disabled={busy || code.length < 8}
            onClick={verifyCode}
          >
            {busy ? "Comprobando…" : "Entrar"}
          </Button>
          <Button variant="tertiary" size="s" disabled={busy} onClick={() => setStep("email")}>
            Usar otro correo
          </Button>
        </>
      )}

      {step === "upload" && (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: el input real está oculto para poder personalizar la zona de arrastre */}
          <div
            className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => event.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <Icon name="gallery" size="l" onBackground="brand-medium" />
            <Text variant="body-strong-s">Arrastra tus fotos o haz clic para elegirlas</Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              JPG, PNG, WebP o AVIF · hasta 8 MB por imagen
            </Text>
          </div>
          <input
            ref={fileInputRef}
            className={styles.hiddenInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={(event) => addFiles(event.target.files)}
          />

          {queue.map((item, index) => (
            <Column key={item.previewUrl} className={styles.queueItem} gap="8">
              <Row gap="12" fillWidth vertical="start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.preview} src={item.previewUrl} alt="" />
                <Column gap="8" flex={1}>
                  <input
                    className={styles.input}
                    type="text"
                    value={item.alt}
                    placeholder="Describe la imagen (obligatorio)"
                    aria-label={`Descripción de ${item.file.name}`}
                    disabled={item.status === "listo"}
                    onChange={(event) => updateAlt(index, event.target.value)}
                  />
                  <Row gap="8" vertical="center" horizontal="between">
                    <Text
                      variant="body-default-xs"
                      onBackground="neutral-weak"
                      className={
                        item.status === "listo"
                          ? styles.success
                          : item.status === "error"
                            ? styles.error
                            : undefined
                      }
                    >
                      {item.status === "error" ? item.error : item.status} ·{" "}
                      {item.orientation === "horizontal" ? "apaisada" : "vertical"}
                    </Text>
                    {item.status !== "listo" && (
                      <Button variant="tertiary" size="s" onClick={() => removeFile(index)}>
                        Quitar
                      </Button>
                    )}
                  </Row>
                </Column>
              </Row>
            </Column>
          ))}

          {queue.length > 0 && (
            <Button
              variant="primary"
              size="m"
              data-border="rounded"
              disabled={busy}
              onClick={uploadAll}
            >
              {busy ? "Subiendo…" : `Subir ${queue.length === 1 ? "la imagen" : "las imágenes"}`}
            </Button>
          )}
        </>
      )}

      {message && (
        <Text
          variant="body-default-s"
          className={message.kind === "error" ? styles.error : undefined}
          onBackground={message.kind === "error" ? undefined : "neutral-weak"}
        >
          {message.text}
        </Text>
      )}
    </Column>
  );
}
