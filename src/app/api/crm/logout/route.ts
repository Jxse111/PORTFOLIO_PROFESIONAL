import { CRM_SESSION_COOKIE, crmCookieOptions } from "@/lib/crm/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CRM_SESSION_COOKIE, "", { ...crmCookieOptions, maxAge: 0 });
  return response;
}
