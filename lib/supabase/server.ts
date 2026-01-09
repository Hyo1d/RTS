import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies as nextCookies } from "next/headers";
import type { Database } from "@/lib/types/supabase";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export const createServerClient = async () => {
  const cookieStore = await nextCookies();
  const { url: supabaseUrl, anonKey: supabaseKey } = assertSupabaseEnv([
    "url",
    "anonKey"
  ]);

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; middleware handles refreshes.
        }
      }
    }
  }) as unknown as SupabaseClient<Database, "public", "public", any>;
};
