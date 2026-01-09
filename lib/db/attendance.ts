import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/supabase";
import { ensureProfileId } from "@/lib/db/profiles";

export type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];

export interface AttendanceFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const sanitizePayload = <T extends Record<string, unknown>>(payload: T) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as T;

export async function getAttendanceRecords({
  employeeId,
  status,
  startDate,
  endDate,
  page = 1,
  pageSize = 10
}: AttendanceFilters = {}) {
  const supabase = await createServerClient();
  let query = supabase
    .from("attendance_records")
    .select("*", { count: "exact" })
    .order("attendance_date", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (startDate) {
    query = query.gte("attendance_date", startDate);
  }

  if (endDate) {
    query = query.lte("attendance_date", endDate);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { data: data ?? [], count: count ?? 0 };
}

export async function getAttendanceByEmployee(employeeId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .order("attendance_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createAttendanceRecord(
  payload: Database["public"]["Tables"]["attendance_records"]["Insert"]
) {
  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);
  const attendanceDate =
    payload.attendance_date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("attendance_records")
    .insert(
      sanitizePayload({
        ...payload,
        attendance_date: attendanceDate,
        status: payload.status ?? "present",
        source: payload.source ?? "manual",
        break_minutes: payload.break_minutes ?? 0,
        created_by: profileId ?? null
      })
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateAttendanceRecord(
  id: string,
  payload: Database["public"]["Tables"]["attendance_records"]["Update"]
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .update(sanitizePayload(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAttendanceRecord(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("attendance_records").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
