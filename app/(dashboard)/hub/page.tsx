import { createClient } from "@/lib/supabase/server";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { HubGrid } from "@/components/hub/hub-grid";

export default async function HubPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const supabase = await createClient();
  const { data: items } = await supabase.from("app_hub_items").select("*").order("sort_order");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">🏠 แอปพลิเคชันทั้งหมด</h1>
      <HubGrid items={items ?? []} isAdmin={isAdmin(session.profile)} />
    </div>
  );
}
