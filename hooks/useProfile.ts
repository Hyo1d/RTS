"use client";

import useSWR from "swr";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/supabase";
import { cacheKey } from "@/lib/data/cache";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR(
    cacheKey("profile", "me"),
    async () => {
      const supabase = createClient();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("No se pudo cargar la sesion");
      }

      const currentUser = userData.user;
      const { data: rows, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .limit(1);

      if (profileError) {
        throw new Error("No se pudo cargar el perfil");
      }

      const existingProfile = rows?.[0] ?? null;
      if (existingProfile) {
        return { profile: existingProfile, user: currentUser };
      }

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: currentUser.id,
          email: currentUser.email ?? "",
          full_name: (currentUser.user_metadata?.full_name as string) ?? null
        })
        .select("*")
        .single();

      if (createError) {
        throw new Error("No se pudo crear el perfil");
      }

      return { profile: createdProfile, user: currentUser };
    }
  );

  return {
    profile: (data?.profile ?? null) as Profile | null,
    user: (data?.user ?? null) as User | null,
    loading: isLoading,
    error: error ? error.message : null,
    refresh: mutate
  };
}
