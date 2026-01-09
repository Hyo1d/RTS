import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/supabase";
import { ensureProfileId } from "@/lib/db/profiles";

export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type EmployeeDocument = Database["public"]["Tables"]["employee_documents"]["Row"];
export type EmployeeSummary = Pick<
  Employee,
  | "id"
  | "employee_number"
  | "first_name"
  | "last_name"
  | "email"
  | "department"
  | "position"
  | "status"
  | "vacation_start"
  | "vacation_end"
  | "start_date"
>;

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getEmployees({
  search,
  department,
  status,
  page = 1,
  pageSize = 10
}: EmployeeFilters = {}) {
  const supabase = await createServerClient();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("employees")
    .select(
      "id, employee_number, first_name, last_name, email, department, position, status, vacation_start, vacation_end, start_date",
      {
        count: "exact"
      }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,employee_number.ilike.%${search}%`
    );
  }

  if (department) {
    query = query.eq("department", department);
  }

  if (status) {
    if (status === "vacation") {
      query = query
        .neq("status", "inactive")
        .neq("status", "disabled")
        .neq("status", "on_leave")
        .lte("vacation_start", today)
        .gte("vacation_end", today);
    } else if (status === "active") {
      query = query
        .eq("status", "active")
        .or(
          `vacation_start.is.null,vacation_end.is.null,vacation_start.gt.${today},vacation_end.lt.${today}`
        );
    } else if (status === "disabled") {
      query = query.eq("status", "inactive");
    } else {
      query = query.eq("status", status);
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { data: (data ?? []) as EmployeeSummary[], count: count ?? 0 };
}

export async function getEmployeeById(id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEmployeeByEmail(email: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEmployeeByUserId(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createEmployee(payload: Database["public"]["Tables"]["employees"]["Insert"]) {
  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);

  const { data, error } = await supabase
    .from("employees")
    .insert({ ...payload, status: payload.status ?? "active", created_by: profileId ?? null })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateEmployee(
  id: string,
  payload: Database["public"]["Tables"]["employees"]["Update"]
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("employees")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteEmployee(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getEmployeeDocuments(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("employee_id", employeeId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function addEmployeeDocument(
  payload: Database["public"]["Tables"]["employee_documents"]["Insert"]
) {
  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);

  const { data, error } = await supabase
    .from("employee_documents")
    .insert({ ...payload, uploaded_by: profileId ?? null })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
