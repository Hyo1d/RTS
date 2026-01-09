import { createServerClient } from "@/lib/supabase/server";
import { getEmployeeByUserId } from "@/lib/db/employees";
import { ensureProfileId } from "@/lib/db/profiles";

export const getPortalContext = async () => {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, employee: null };
  }

  await ensureProfileId(supabase);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const employee = await getEmployeeByUserId(user.id);

  return { user, profile, employee };
};
