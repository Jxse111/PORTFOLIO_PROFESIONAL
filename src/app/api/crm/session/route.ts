import { hasCrmSessionFromRequest } from "@/lib/crm/guard";
import { readCredentials } from "@/lib/crm/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const [credentials, authenticated] = await Promise.all([
    readCredentials(),
    Promise.resolve(hasCrmSessionFromRequest(request)),
  ]);

  return NextResponse.json({ configured: Boolean(credentials), authenticated });
}
