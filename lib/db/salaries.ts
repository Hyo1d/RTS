import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/supabase";
import { ensureProfileId } from "@/lib/db/profiles";

export type Salary = Database["public"]["Tables"]["salaries"]["Row"];
export type SalaryReceipt = Database["public"]["Tables"]["salary_receipts"]["Row"];

export interface SalaryFilters {
  employeeId?: string;
  currentOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SalaryReceiptFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getSalariesFiltered({
  employeeId,
  currentOnly,
  page = 1,
  pageSize = 10
}: SalaryFilters = {}) {
  const supabase = await createServerClient();
  let query = supabase
    .from("salaries")
    .select("*", { count: "exact" })
    .order("effective_date", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  if (currentOnly) {
    query = query.eq("is_current", true);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { data: data ?? [], count: count ?? 0 };
}

export async function getSalaries(employeeId?: string) {
  const { data } = await getSalariesFiltered({ employeeId });
  return data;
}

export async function getCurrentSalaries() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("salaries")
    .select("*", { count: "exact" })
    .eq("is_current", true);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createSalary(payload: Database["public"]["Tables"]["salaries"]["Insert"]) {
  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);
  const isCurrent = payload.is_current ?? true;

  if (payload.employee_id && isCurrent) {
    const endDate =
      payload.effective_date && payload.effective_date.length > 0
        ? payload.effective_date
        : null;
    const { error: currentError } = await supabase
      .from("salaries")
      .update({ is_current: false, end_date: endDate })
      .eq("employee_id", payload.employee_id)
      .eq("is_current", true);

    if (currentError) {
      throw new Error(currentError.message);
    }
  }

  const { data, error } = await supabase
    .from("salaries")
    .insert({ ...payload, is_current: isCurrent, created_by: profileId ?? null })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateSalary(
  id: string,
  payload: Database["public"]["Tables"]["salaries"]["Update"]
) {
  const supabase = await createServerClient();
  if (payload.is_current) {
    const { data: current, error: currentError } = await supabase
      .from("salaries")
      .select("employee_id")
      .eq("id", id)
      .single();

    if (currentError) {
      throw new Error(currentError.message);
    }

    const employeeId = payload.employee_id ?? current?.employee_id;
    if (employeeId) {
      const { error: clearError } = await supabase
        .from("salaries")
        .update({ is_current: false })
        .eq("employee_id", employeeId)
        .eq("is_current", true)
        .neq("id", id);

      if (clearError) {
        throw new Error(clearError.message);
      }
    }
  }
  const { data, error } = await supabase
    .from("salaries")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteSalary(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("salaries").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getSalaryReceiptsFiltered({
  employeeId,
  status,
  startDate,
  endDate,
  page = 1,
  pageSize = 10
}: SalaryReceiptFilters = {}) {
  const supabase = await createServerClient();
  let query = supabase
    .from("salary_receipts")
    .select("*", { count: "exact" })
    .order("payment_date", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (startDate) {
    query = query.gte("period_start", startDate);
  }

  if (endDate) {
    query = query.lte("period_end", endDate);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { data: data ?? [], count: count ?? 0 };
}

export async function getSalaryReceipts(employeeId?: string) {
  const { data } = await getSalaryReceiptsFiltered({ employeeId });
  return data;
}

export async function createSalaryReceipt(
  payload: Database["public"]["Tables"]["salary_receipts"]["Insert"]
) {
  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);

  const { data, error } = await supabase
    .from("salary_receipts")
    .insert({ ...payload, created_by: profileId ?? null })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateSalaryReceipt(
  id: string,
  payload: Database["public"]["Tables"]["salary_receipts"]["Update"]
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("salary_receipts")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteSalaryReceipt(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("salary_receipts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
