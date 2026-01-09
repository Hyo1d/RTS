"use client";

import type { AttendanceRecord } from "@/lib/db/attendance";
import { useApiQuery } from "@/lib/data/cache";

interface AttendanceFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function useAttendanceRecords(filters: AttendanceFilters = {}) {
  const { data, count, error, isLoading, mutate } = useApiQuery<AttendanceRecord[]>(
    "attendance",
    "/api/attendance",
    {
      employeeId: filters.employeeId,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      pageSize: filters.pageSize
    }
  );

  return {
    data: data ?? [],
    count,
    loading: isLoading,
    error: error ? "No se pudieron cargar asistencias" : null,
    refresh: mutate
  };
}
