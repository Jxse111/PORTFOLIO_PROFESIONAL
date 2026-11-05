import CrmDashboard from "@/components/crm/CrmDashboard";
import { hasCrmSession } from "@/lib/crm/guard";
import { readCredentials } from "@/lib/crm/store";
import { readUploadedImages } from "@/lib/gallery/images";
import { readEpisodes } from "@/lib/podcast/episodes";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const credentials = await readCredentials();
  if (!credentials) redirect("/crm/setup");
  if (!(await hasCrmSession())) redirect("/crm/login");

  const [episodes, images] = await Promise.all([
    readEpisodes().catch(() => []),
    readUploadedImages().catch(() => []),
  ]);

  return <CrmDashboard episodes={episodes} images={images} />;
}
