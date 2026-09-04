import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MAX_MESSAGE_LENGTH = 2000;

// Simple in-memory rate limiter (use Redis/Upstash in production)
const attempts = new Map<string, number[]>();
function isRateLimited(ip: string, limit = 20, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = attempts.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    let body: { message?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL not set');
      return NextResponse.json({ error: 'n8n webhook URL not configured' }, { status: 500 });
    }

    // Basic SSRF guard: ensure the configured URL uses https
    try {
      const parsed = new URL(n8nWebhookUrl);
      if (parsed.protocol !== 'https:') {
        throw new Error('Only HTTPS webhooks are allowed');
      }
    } catch {
      return NextResponse.json({ error: 'Invalid n8n webhook URL' }, { status: 500 });
    }

    const payload = { message };

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && {
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n error response:', errorText);
      return NextResponse.json({ error: `n8n error: ${response.status}` }, { status: response.status });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json({ error: 'Invalid response from n8n' }, { status: 502 });
    }

    if (!data.response && !data.output && !data.message && !data.text && !data.result) {
      data = { response: JSON.stringify(data) };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
