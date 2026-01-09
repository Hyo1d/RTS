"use client";

import type { Salary } from "@/lib/db/salaries";
import { useApiQuery } from "@/lib/data/cache";

export interface SalaryFilters {
  employeeId?: string;
  currentOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export function useSalaries(filters?: string | SalaryFilters) {
  const normalized =
    typeof filters === "string" ? { employeeId: filters } : filters ?? {};

  const { data, error, isLoading, mutate } = useApiQuery<Salary[]>(
    "salaries",
    "/api/salaries",
    {
      employeeId: normalized.employeeId,
      currentOnly: normalized.currentOnly ? "true" : undefined,
      page: normalized.page,
      pageSize: normalized.pageSize
    }
  );

  return {
    data: data ?? [],
    loading: isLoading,
    error: error ? "No se pudieron cargar sueldos" : null,
    refresh: mutate
  };
}
