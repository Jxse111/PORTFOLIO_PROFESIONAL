"use client";

import styles from "@/app/crm/crm.module.scss";
import ActionButton from "@/components/podcast/ActionButton";
import { Heading, Text } from "@once-ui-system/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "email" | "code" | "password" | "confirm";

interface Props {
  /** En local no se envía correo: se salta directo a la contraseña. */
  devBootstrap?: boolean;
}

export default function CrmSetup({ devBootstrap = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(devBootstrap ? "password" : "email");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [secret, setSecret] = useState<{ raw: string; formatted: string; otpauth: string } | null>(
    null,
  );
  const [appCode, setAppCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const call = async (url: string, body: unknown) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as Record<string, string | undefined>;
    if (!response.ok) throw new Error(data.message ?? "Algo ha fallado");
    return data;
  };

  const sendEmailCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await call("/api/gallery/request-code", { email: email.trim().toLowerCase() });
      setStep("code");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "No se pudo enviar el código");
    } finally {
      setBusy(false);
    }
  };

  const confirmEmailCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await call("/api/gallery/verify-code", { code: emailCode.trim() });
      setStep("password");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Código incorrecto");
    } finally {
      setBusy(false);
    }
  };

  const choosePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError("La contraseña debe mezclar letras y números.");
      return;
    }
    if (password !== repeat) {
      setError("Las dos contraseñas no coinciden");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = await call("/api/crm/setup", { action: "secret" });
      setSecret({
        raw: String(data.raw ?? ""),
        formatted: String(data.secret ?? ""),
        otpauth: String(data.otpauth ?? ""),
      });
      setStep("confirm");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "No se pudo preparar el acceso");
    } finally {
      setBusy(false);
    }
  };

  const finish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (appCode.length > 0 && appCode.length !== 6) {
      setError("El código de la app tiene 6 dígitos (o déjalo vacío en local).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await call("/api/crm/setup", {
        action: "finish",
        password,
        secret: secret?.raw,
        code: appCode.replace(/\s/g, ""),
      });
      router.replace("/crm/login");
      router.refresh();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "No se pudo guardar el acceso");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.card} ${styles.narrow}`}>
      <Heading variant="heading-strong-l">Crear acceso al CRM</Heading>

      {step === "email" ? (
        <form className={styles.cardPlain} onSubmit={sendEmailCode}>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Primero confirma que eres tú: enviaremos un código al correo autorizado del sitio.
          </Text>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="crm-email">
              Correo
            </label>
            <input
              id="crm-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className={styles.actions}>
            <ActionButton type="submit" loading={busy}>
              Enviar código
            </ActionButton>
          </div>
        </form>
      ) : null}

      {step === "code" ? (
        <form className={styles.cardPlain} onSubmit={confirmEmailCode}>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Escribe el código que acaba de llegar a tu correo.
          </Text>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="crm-email-code">
              Código del correo
            </label>
            <input
              id="crm-email-code"
              className={`${styles.input} ${styles.code}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={emailCode}
              onChange={(event) => setEmailCode(event.target.value)}
              required
            />
          </div>
          <div className={styles.actions}>
            <ActionButton type="submit" loading={busy}>
              Comprobar
            </ActionButton>
          </div>
        </form>
      ) : null}

      {step === "password" ? (
        <form className={styles.cardPlain} onSubmit={choosePassword}>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Elige una contraseña (mínimo 8 caracteres, con letras y números). Solo se guarda
            cifrada.
          </Text>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="crm-new-password">
              Contraseña
            </label>
            <input
              id="crm-new-password"
              className={styles.input}
              type="password"
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <span className={styles.hint}>Mínimo 8 caracteres, mezclando letras y números.</span>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="crm-repeat-password">
              Repite la contraseña
            </label>
            <input
              id="crm-repeat-password"
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              required
            />
          </div>
          <div className={styles.actions}>
            <ActionButton type="submit" loading={busy}>
              Continuar
            </ActionButton>
          </div>
        </form>
      ) : null}

      {step === "confirm" && secret ? (
        <form className={styles.cardPlain} onSubmit={finish}>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Abre tu app de autenticación, añade una cuenta nueva con estos datos:
          </Text>
          <div className={styles.field}>
            <span className={styles.label}>Secreto (para introducirlo a mano)</span>
            <code className={styles.secret}>{secret.formatted}</code>
            <button
              type="button"
              className={styles.copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(secret.raw);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2500);
                } catch {
                  setError("Copia el secreto a mano, tu navegador no ha dejado copiarlo.");
                }
              }}
            >
              {copied ? "Copiado" : "Copiar secreto"}
            </button>
          </div>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Cuenta: Apple Slices · Tipo: basado en tiempo · 6 dígitos cada 30 s. En el iPhone:
            Contraseñas → + → Otra contraseña con código, y pega el secreto.
            {devBootstrap ? " En local puedes guardar sin código." : ""}
          </Text>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="crm-app-code">
              Código que muestra la app
            </label>
            <input
              id="crm-app-code"
              className={`${styles.input} ${styles.code}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={appCode}
              onChange={(event) => setAppCode(event.target.value.replace(/\D/g, ""))}
            />
            <span className={styles.hint}>
              {devBootstrap
                ? "En local puedes dejarlo vacío y guardar igualmente."
                : "6 dígitos de tu app de autenticación."}
            </span>
          </div>
          <div className={styles.actions}>
            <ActionButton type="submit" loading={busy}>
              Guardar acceso
            </ActionButton>
          </div>
        </form>
      ) : null}

      {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
    </div>
  );
}
