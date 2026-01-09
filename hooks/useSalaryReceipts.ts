"use client";

import type { SalaryReceipt } from "@/lib/db/salaries";
import { useApiQuery } from "@/lib/data/cache";

export interface SalaryReceiptFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function useSalaryReceipts(filters?: string | SalaryReceiptFilters) {
  const normalized =
    typeof filters === "string" ? { employeeId: filters } : filters ?? {};

  const { data, error, isLoading, mutate } = useApiQuery<SalaryReceipt[]>(
    "salary-receipts",
    "/api/salary-receipts",
    {
      employeeId: normalized.employeeId,
      status: normalized.status,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      page: normalized.page,
      pageSize: normalized.pageSize
    }
  );

  return {
    data: data ?? [],
    loading: isLoading,
    error: error ? "No se pudieron cargar recibos" : null,
    refresh: mutate
  };
}
