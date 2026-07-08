import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/db/database.types";

export type Profile = Database["public"]["Tables"]["users"]["Row"];

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
}

/** Returns the current authenticated user + app profile, or null if unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) return null;

  return { id: authData.user.id, email: authData.user.email ?? profile.email, profile };
}

export function isManagerOrAdmin(profile: Profile) {
  return profile.role === "manager" || profile.role === "admin";
}

export function isAdmin(profile: Profile) {
  return profile.role === "admin";
}
