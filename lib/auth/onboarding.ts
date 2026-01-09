import type { Database } from "@/lib/types/supabase";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileCompletenessFields = Pick<
  ProfileRow,
  "full_name" | "email" | "phone" | "dni" | "date_of_birth"
>;

const hasValue = (value?: string | null) =>
  typeof value === "string" && value.trim().length > 0;

export const isProfileComplete = (profile?: ProfileCompletenessFields | null) => {
  if (!profile) return false;
  return (
    hasValue(profile.full_name) &&
    hasValue(profile.email) &&
    hasValue(profile.phone) &&
    hasValue(profile.dni) &&
    hasValue(profile.date_of_birth)
  );
};
