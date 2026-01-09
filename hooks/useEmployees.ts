"use client";

import type { EmployeeSummary } from "@/lib/db/employees";
import { useApiQuery, type QueryParams } from "@/lib/data/cache";

export type UseEmployeesParams = QueryParams & {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export function useEmployees(params: UseEmployeesParams = {}) {
  const { data, count, error, isLoading, mutate } = useApiQuery<EmployeeSummary[]>(
    "employees",
    "/api/employees",
    params
  );

  return {
    data: data ?? [],
    count,
    loading: isLoading,
    error: error ? "No se pudieron cargar empleados" : null,
    refresh: mutate
  };
}
