// Deno Edge Function runtime — shared service-role client.
// @deno-types="npm:@supabase/supabase-js@2"
import { createClient } from "npm:@supabase/supabase-js@2";

export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
