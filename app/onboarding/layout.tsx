import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ensureProfileId } from "@/lib/db/profiles";
import { isProfileComplete } from "@/lib/auth/onboarding";
import { isAdminRole } from "@/lib/auth/roles";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
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

  if (isProfileComplete(profile)) {
    redirect(isAdminRole(profile?.role) ? "/dashboard" : "/portal");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      {children}
    </div>
  );
}
