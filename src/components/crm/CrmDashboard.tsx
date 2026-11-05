"use client";

import styles from "@/app/crm/crm.module.scss";
import ActionButton from "@/components/podcast/ActionButton";
import type { UploadedImage } from "@/lib/gallery/images";
import { MAX_AUDIO_BYTES } from "@/lib/podcast/config";
import type { PodcastEpisode } from "@/lib/podcast/types";
import { Text } from "@once-ui-system/core";
import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Section = "podcast" | "gallery";

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    const finish = (value: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => finish(0);
    audio.src = url;
  });
}

function minutes(seconds: number): string {
  if (!seconds) return "—";
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

interface Props {
  episodes: PodcastEpisode[];
  images: UploadedImage[];
}

export default function CrmDashboard({ episodes, images }: Props) {
  const router = useRouter();
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<Section>("podcast");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "ok" } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10));
  const [audio, setAudio] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [picture, setPicture] = useState<File | null>(null);

  const notify = (text: string, kind: "error" | "ok" = "error") => setMessage({ text, kind });

  const uploadEpisode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!audio) {
      notify("Elige el archivo de audio");
      return;
    }

    setBusy(true);
    setMessage(null);
    setProgress(0);

    try {
      const pathname = `podcast/audio/${slug(title) || "episodio"}-${Date.now()}.${
        audio.name.split(".").pop() ?? "m4a"
      }`;

      const blob = await upload(pathname, audio, {
        access: "public",
        handleUploadUrl: "/api/podcast/upload",
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      const duration = await readDuration(audio);

      const response = await fetch("/api/podcast/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          audioUrl: blob.url,
          pathname: blob.pathname,
          contentType: audio.type || "audio/mpeg",
          sizeBytes: audio.size,
          durationSeconds: duration,
          publishedAt,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "No se pudo publicar");

      setTitle("");
      setDescription("");
      setAudio(null);
      if (audioRef.current) audioRef.current.value = "";
      notify("Episodio publicado", "ok");
      router.refresh();
    } catch (issue) {
      notify(issue instanceof Error ? issue.message : "No se pudo subir el audio");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const uploadPicture = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!picture) {
      notify("Elige una imagen");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const body = new FormData();
      body.append("file", picture);
      body.append("alt", alt.trim());
      body.append("orientation", orientation);

      const response = await fetch("/api/gallery/upload", { method: "POST", body });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "No se pudo subir la imagen");

      setAlt("");
      setPicture(null);
      if (imageRef.current) imageRef.current.value = "";
      notify("Imagen añadida", "ok");
      router.refresh();
    } catch (issue) {
      notify(issue instanceof Error ? issue.message : "No se pudo subir la imagen");
    } finally {
      setBusy(false);
    }
  };

  const removeEpisode = async (id: string) => {
    if (!window.confirm("¿Borrar este episodio de la web?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/podcast/episodes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("No se pudo borrar");
      notify("Episodio borrado", "ok");
      router.refresh();
    } catch (issue) {
      notify(issue instanceof Error ? issue.message : "No se pudo borrar");
    } finally {
      setBusy(false);
    }
  };

  const removePicture = async (src: string) => {
    if (!window.confirm("¿Quitar esta imagen de la web?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/gallery/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src }),
      });
      if (!response.ok) throw new Error("No se pudo borrar");
      notify("Imagen borrada", "ok");
      router.refresh();
    } catch (issue) {
      notify(issue instanceof Error ? issue.message : "No se pudo borrar");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/crm/logout", { method: "POST" });
    router.replace("/crm/login");
    router.refresh();
  };

  return (
    <>
      <div className={styles.header}>
        <div>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Panel privado
          </Text>
          <Text variant="heading-strong-l">Contenido del sitio</Text>
        </div>
        <ActionButton variant="ghost" size="sm" onClick={logout}>
          Salir
        </ActionButton>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={section === "podcast"}
          className={`${styles.tab} ${section === "podcast" ? styles.tabActive : ""}`}
          onClick={() => setSection("podcast")}
        >
          Podcast
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "gallery"}
          className={`${styles.tab} ${section === "gallery" ? styles.tabActive : ""}`}
          onClick={() => setSection("gallery")}
        >
          Galería
        </button>
      </div>

      {message ? (
        <p className={`${styles.message} ${message.kind === "ok" ? styles.ok : styles.error}`}>
          {message.text}
        </p>
      ) : null}

      {section === "podcast" ? (
        <>
          <form className={styles.card} onSubmit={uploadEpisode}>
            <Text variant="heading-strong-s">Nuevo episodio</Text>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-title">
                Título
              </label>
              <input
                id="crm-title"
                className={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-description">
                Descripción
              </label>
              <textarea
                id="crm-description"
                className={styles.textarea}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-date">
                Fecha
              </label>
              <input
                id="crm-date"
                className={styles.input}
                type="date"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-audio">
                Audio (M4A, MP3, WAV u OGG · máx. 200 MB)
              </label>
              <input
                id="crm-audio"
                ref={audioRef}
                className={styles.input}
                type="file"
                accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,audio/webm"
                onChange={(event) => setAudio(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className={styles.actions}>
              <ActionButton type="submit" loading={busy || progress !== null}>
                {progress !== null ? `Subiendo ${progress}%` : "Publicar episodio"}
              </ActionButton>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Límite {Math.round(MAX_AUDIO_BYTES / 1024 / 1024)} MB
              </Text>
            </div>
          </form>

          <div className={styles.card}>
            <Text variant="heading-strong-s">Publicados</Text>
            {episodes.length === 0 ? (
              <p className={styles.empty}>Todavía no hay episodios.</p>
            ) : (
              <ul className={styles.list}>
                {episodes.map((episode) => (
                  <li key={episode.id} className={styles.item}>
                    <div className={styles.itemText}>
                      <span className={styles.itemTitle}>{episode.title}</span>
                      <span className={styles.meta}>
                        {episode.publishedAt} · {minutes(episode.durationSeconds)}
                      </span>
                    </div>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => removeEpisode(episode.id)}
                    >
                      Borrar
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {section === "gallery" ? (
        <>
          <form className={styles.card} onSubmit={uploadPicture}>
            <Text variant="heading-strong-s">Nueva imagen</Text>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-picture">
                Archivo (JPG, PNG, WebP o AVIF · máx. 8 MB)
              </label>
              <input
                id="crm-picture"
                ref={imageRef}
                className={styles.input}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => setPicture(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-alt">
                Descripción
              </label>
              <input
                id="crm-alt"
                className={styles.input}
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="crm-orientation">
                Formato
              </label>
              <select
                id="crm-orientation"
                className={styles.input}
                value={orientation}
                onChange={(event) =>
                  setOrientation(event.target.value === "vertical" ? "vertical" : "horizontal")
                }
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
            <div className={styles.actions}>
              <ActionButton type="submit" loading={busy}>
                Subir imagen
              </ActionButton>
            </div>
          </form>

          <div className={styles.card}>
            <Text variant="heading-strong-s">En la galería</Text>
            {images.length === 0 ? (
              <p className={styles.empty}>No hay imágenes subidas.</p>
            ) : (
              <ul className={styles.list}>
                {images.map((image) => (
                  <li key={image.src} className={styles.item}>
                    <div className={styles.actions}>
                      <div className={styles.thumb}>
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="64px"
                          className={styles.thumbImage}
                        />
                      </div>
                      <div className={styles.itemText}>
                        <span className={styles.itemTitle}>{image.alt}</span>
                        <span className={styles.meta}>{image.orientation}</span>
                      </div>
                    </div>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => removePicture(image.src)}
                    >
                      Borrar
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
