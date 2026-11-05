import CrmSetup from "@/components/crm/CrmSetup";
import { readCredentials } from "@/lib/crm/store";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CrmSetupPage() {
  if (await readCredentials()) redirect("/crm/login");
  return <CrmSetup />;
}
