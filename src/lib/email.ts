export type PostInfo = {
  title: string;
  url: string;
  summary?: string;
};

export async function sendPostNotification(toEmails: string[], post: PostInfo) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user || "no-reply@example.com";

  if (!host || !port || !user || !pass) {
    console.warn("SMTP credentials are not configured. Skipping email send.");
    return { skipped: true } as const;
  }

  // Dynamic import to avoid build-time dependency if not installed
  type NodemailerLike = { createTransport: (opts: unknown) => { sendMail: (msg: unknown) => Promise<unknown> } };
  const nmModule = (await import("nodemailer")) as unknown as NodemailerLike & { default?: NodemailerLike };
  const nodemailer = (nmModule.default ?? nmModule) as NodemailerLike;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const site = process.env.SITE_BASE_URL || process.env.BASE_URL || "";
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h1 style="margin: 0 0 12px; font-size: 20px;">Nuevo post: ${escapeHtml(post.title)}</h1>
      ${post.summary ? `<p style="margin: 0 0 12px; color: #374151;">${escapeHtml(post.summary)}</p>` : ""}
      <p style="margin: 0 0 16px;">Puedes leerlo aquí:</p>
      <p style="margin: 0 0 24px;"><a href="${post.url}" style="color: #2563EB;">${post.url}</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size: 12px; color: #6B7280;">Recibes este correo porque te suscribiste al newsletter.</p>
      <p style="font-size: 12px; color: #6B7280;">Si no quieres recibir más correos, puedes <a href="${site}/unsubscribe" style="color:#2563EB;">darte de baja</a>.</p>
    </div>
  `;

  const message = {
    from,
    subject: `Nuevo post: ${post.title}`,
    text: `Nuevo post: ${post.title}\n${post.url}`,
    html,
  };

  await transporter.sendMail(message);
  return { sent: true } as const;
}

/**
 * Envía el código de verificación para subir imágenes a la galería.
 * Lanza si el SMTP no está configurado: aquí un fallo silencioso dejaría al
 * usuario esperando un correo que nunca llega.
 */
export async function sendGalleryCode(to: string, code: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user;

  if (!host || !port || !user || !pass) {
    throw new Error("Faltan las credenciales SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).");
  }

  type NodemailerLike = {
    createTransport: (opts: unknown) => { sendMail: (msg: unknown) => Promise<unknown> };
  };
  const nmModule = (await import("nodemailer")) as unknown as NodemailerLike & {
    default?: NodemailerLike;
  };
  const nodemailer = (nmModule.default ?? nmModule) as NodemailerLike;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h1 style="margin: 0 0 12px; font-size: 20px;">Tu código para subir imágenes</h1>
      <p style="margin: 0 0 16px; color: #374151;">Introduce este código en la galería para continuar:</p>
      <p style="margin: 0 0 24px; font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${escapeHtml(code)}</p>
      <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">Caduca en 10 minutos y solo sirve una vez.</p>
      <p style="margin: 0; color: #6B7280; font-size: 14px;">Si no has sido tú, ignora este correo: sin el código nadie puede subir nada.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `Código para subir imágenes: ${code}`,
    text: `Tu código para subir imágenes a la galería es ${code}. Caduca en 10 minutos.`,
    html,
  });

  return { sent: true } as const;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
