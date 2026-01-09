import { AppUsersTable } from "@/components/app-users/app-users-table";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAuthUsersUrl } from "@/lib/utils/supabase-links";

export default async function AppUsersPage() {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = error ? [] : data.users;
  const { data: employeesResponse } = await admin
    .from("employees")
    .select("id, user_id, email, status, position, department");
  const employees = employeesResponse ?? [];
  const supabaseAuthUrl = getSupabaseAuthUsersUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  return (
    <AppUsersTable
      initialUsers={users}
      initialEmployees={employees}
      supabaseAuthUrl={supabaseAuthUrl}
    />
  );
}
