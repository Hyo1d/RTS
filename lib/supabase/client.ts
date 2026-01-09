import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export const createClient = () => {
  const { url: supabaseUrl, anonKey: supabaseKey } = assertSupabaseEnv([
    "url",
    "anonKey"
  ]);

  return createBrowserClient<Database>(supabaseUrl, supabaseKey) as unknown as SupabaseClient<
    Database,
    "public",
    "public",
    any
  >;
};
