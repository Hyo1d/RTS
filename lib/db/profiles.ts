import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

export async function ensureProfileId(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.id) {
      return profile.id;
    }

    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) ?? null,
        role: "employee"
      })
      .select("id")
      .single();

    return created?.id ?? null;
  } catch {
    return null;
  }
}
