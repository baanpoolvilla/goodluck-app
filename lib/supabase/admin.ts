import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

/**
 * Service-role client — bypasses RLS entirely. Server-only: cron/Edge
 * Functions and the handful of admin-only route handlers that must write
 * to tables (e.g. penalty_logs) with no direct user-write policy.
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
