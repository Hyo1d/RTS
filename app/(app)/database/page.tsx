import { DatabaseTabs } from "@/components/database/database-tabs";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/db/employees";
import { getSupabaseDashboardUrl } from "@/lib/utils/supabase-links";

export default async function DatabasePage() {
  const supabase = await createServerClient();
  const employeesResponse = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .order("first_name", { ascending: true });
  const employees = (employeesResponse.data ?? []) as Pick<
    Employee,
    "id" | "first_name" | "last_name"
  >[];

  const supabaseDashboardUrl = getSupabaseDashboardUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  return <DatabaseTabs employees={employees} supabaseDashboardUrl={supabaseDashboardUrl} />;
}
