import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const REPORT_SECRET = process.env.REPORT_SECRET;
const REPORT_TO = process.env.REPORT_TO || "josemartinezestrada111@gmail.com";

interface SpeedInsightsResponse {
  data?: Array<{
    id: string;
    url: string;
    lcp?: number;
    inp?: number;
    cls?: number;
    ttfb?: number;
    fcp?: number;
    views?: number;
  }>;
}

export async function GET(request: Request) {
  // Basic secret check so only the cron job can trigger this endpoint.
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!REPORT_SECRET || secret !== REPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json(
      { error: "Vercel token or project ID not configured" },
      { status: 500 }
    );
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const from = oneDayAgo.toISOString();
  const to = now.toISOString();

  let insights: SpeedInsightsResponse = {};
  let insightsError: string | null = null;

  try {
    const url = new URL("https://api.vercel.com/v1/speed-insights");
    url.searchParams.set("projectId", VERCEL_PROJECT_ID);
    url.searchParams.set("environment", "production");
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.set("limit", "10");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API returned ${response.status}`);
    }

    insights = (await response.json()) as SpeedInsightsResponse;
  } catch (err) {
    insightsError = err instanceof Error ? err.message : String(err);
  }

  const rows = insights.data || [];
  const totalViews = rows.reduce((sum, row) => sum + (row.views || 0), 0);

  const avg = (key: keyof (typeof rows)[0]) => {
    const values = rows
      .map((row) => row[key])
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return "N/A";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3);
  };

  const subject = `📊 Reporte diario - ${now.toLocaleDateString("es-ES")}`;
  const html = `
    <h1>Reporte diario de velocidad</h1>
    <p><strong>Período:</strong> ${oneDayAgo.toLocaleString("es-ES")} - ${now.toLocaleString("es-ES")}</p>
    <p><strong>Total de vistas:</strong> ${totalViews}</p>
    <p><strong>Páginas analizadas:</strong> ${rows.length}</p>
    <h2>Core Web Vitals (promedio)</h2>
    <ul>
      <li>LCP: ${avg("lcp")}</li>
      <li>INP: ${avg("inp")}</li>
      <li>CLS: ${avg("cls")}</li>
      <li>TTFB: ${avg("ttfb")}</li>
      <li>FCP: ${avg("fcp")}</li>
    </ul>
    ${insightsError ? `<p style="color:red"><strong>Error al obtener métricas:</strong> ${insightsError}</p>` : ""}
    <hr />
    <p>Este reporte fue generado automáticamente por Vercel Cron.</p>
  `;

  const text = `
Reporte diario de velocidad
Período: ${oneDayAgo.toLocaleString("es-ES")} - ${now.toLocaleString("es-ES")}
Total de vistas: ${totalViews}
Páginas analizadas: ${rows.length}

Core Web Vitals (promedio):
- LCP: ${avg("lcp")}
- INP: ${avg("inp")}
- CLS: ${avg("cls")}
- TTFB: ${avg("ttfb")}
- FCP: ${avg("fcp")}

${insightsError ? `Error al obtener métricas: ${insightsError}` : ""}
  `.trim();

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json(
      { error: "SMTP credentials not configured" },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.REPORT_FROM || smtpUser,
      to: REPORT_TO,
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true, message: "Report sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to send report email:", message);
    return NextResponse.json({ error: "Failed to send email", message }, { status: 500 });
  }
}
