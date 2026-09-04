import { NextRequest, NextResponse } from "next/server";
import * as cookie from "cookie";
import { createHmac, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET;

function verifyToken(token: string): boolean {
  if (!AUTH_SECRET) return false;
  const [h, b, s] = token.split(".");
  if (!h || !b || !s) return false;
  const expected = createHmac("sha256", AUTH_SECRET).update(`${h}.${b}`).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(s), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookie.parse(cookieHeader);

  if (cookies.authToken && verifyToken(cookies.authToken)) {
    return NextResponse.json({ authenticated: true }, { status: 200 });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
