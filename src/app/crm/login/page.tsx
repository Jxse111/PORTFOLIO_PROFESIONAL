import CrmLogin from "@/components/crm/CrmLogin";
import { hasCrmSession } from "@/lib/crm/guard";
import { readCredentials } from "@/lib/crm/store";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CrmLoginPage() {
  const credentials = await readCredentials();
  if (!credentials) redirect("/crm/setup");
  if (await hasCrmSession()) redirect("/crm");

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", width: "100%" }}>
      <CrmLogin devMode={process.env.NODE_ENV !== "production"} />
    </div>
  );
}
