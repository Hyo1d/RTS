import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/auth/roles";
import { isProfileComplete } from "@/lib/auth/onboarding";
import { ensureProfileId } from "@/lib/db/profiles";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfileId(supabase);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, phone, dni, date_of_birth")
    .eq("id", user.id)
    .maybeSingle();

  if (!isProfileComplete(profile)) {
    redirect("/onboarding");
  }

  if (!isAdminRole(profile?.role)) {
    redirect("/portal");
  }

  return <AppShell>{children}</AppShell>;
}
