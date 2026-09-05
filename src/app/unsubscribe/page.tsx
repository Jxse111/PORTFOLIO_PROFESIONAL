"use client";

import { useState } from "react";
import { Column, Heading, Text, Row, Input, Button } from "@once-ui-system/core";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Introduce un correo válido.");
      return;
    }
    setError("");
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al darse de baja");
      }
      setStatus("success");
      setMessage(data.message || "Te has dado de baja del newsletter.");
      setEmail("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Ha ocurrido un error. Inténtalo de nuevo más tarde.");
    }
  };

  return (
    <Column maxWidth="s" paddingTop="24" gap="16">
      <Heading variant="heading-strong-xl" marginBottom="8">Darse de baja</Heading>
      <Text variant="body-default-m" onBackground="neutral-weak">
        Introduce tu correo para dejar de recibir notificaciones.
      </Text>
      <form onSubmit={onSubmit}>
        <Row fillWidth gap="8" s={{ direction: "column" }}>
          <Input
            id="unsubscribe-email"
            name="email"
            type="email"
            placeholder="Correo/Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errorMessage={error}
          />
          <Row height="48" vertical="center">
            <Button type="submit" size="m" fillWidth disabled={status === "loading"}>
              {status === "loading" ? "Procesando..." : "Darme de baja"}
            </Button>
          </Row>
          {message && (
            <Text variant="body-default-s" onBackground={status === "error" ? "danger-strong" : "success-strong"}>
              {message}
            </Text>
          )}
        </Row>
      </form>
    </Column>
  );
}
