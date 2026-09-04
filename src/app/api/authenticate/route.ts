import { NextRequest, NextResponse } from "next/server";
import * as cookie from "cookie";
import { createHmac, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET;

function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", AUTH_SECRET!).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

// Simple in-memory rate limiter (use Redis/Upstash in production)
const attempts = new Map<string, number[]>();
function isRateLimited(ip: string, limit = 5, windowMs = 15 * 60 * 1000): boolean {
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
    return NextResponse.json({ message: "Too many attempts" }, { status: 429 });
  }

  if (!AUTH_SECRET) {
    console.error("AUTH_SECRET environment variable is not set");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { password } = body;
  const correctPassword = process.env.PAGE_ACCESS_PASSWORD;

  if (!correctPassword) {
    console.error("PAGE_ACCESS_PASSWORD environment variable is not set");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }

  if (password !== correctPassword) {
    return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
  }

  const token = signToken({ auth: true });

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.headers.set(
    "Set-Cookie",
    cookie.serialize("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60,
      sameSite: "strict",
      path: "/",
    }),
  );

  return response;
}
