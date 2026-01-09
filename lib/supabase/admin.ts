import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export const createAdminClient = () => {
  const { url: supabaseUrl, serviceRoleKey } = assertSupabaseEnv([
    "url",
    "serviceRoleKey"
  ]);

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
