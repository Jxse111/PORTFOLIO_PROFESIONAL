"use client";

import styles from "@/app/crm/crm.module.scss";
import ActionButton from "@/components/podcast/ActionButton";
import { Heading, Text } from "@once-ui-system/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CrmLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/crm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: code.replace(/\s/g, "") }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "No se pudo entrar");
        return;
      }

      router.replace("/crm");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <Heading variant="heading-strong-l">Contenido</Heading>
      <Text variant="body-default-s" onBackground="neutral-weak">
        Contraseña y código de 6 dígitos de tu app de autenticación.
      </Text>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="crm-password">
          Contraseña
        </label>
        <input
          id="crm-password"
          className={styles.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="crm-code">
          Código
        </label>
        <input
          id="crm-code"
          className={`${styles.input} ${styles.code}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          required
        />
      </div>

      {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}

      <div className={styles.actions}>
        <ActionButton type="submit" loading={busy} disabled={code.length !== 6}>
          Entrar
        </ActionButton>
      </div>
    </form>
  );
}
