"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/lib/db/employees";
import type { Salary } from "@/lib/db/salaries";
import { downloadCsv } from "@/lib/utils/csv";
import { formatDate } from "@/lib/utils/date";
import { apiFetch, buildApiUrl, useApiQuery } from "@/lib/data/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface SalariesDatabaseProps {
  employees: Pick<Employee, "id" | "first_name" | "last_name">[];
}

export function SalariesDatabase({ employees }: SalariesDatabaseProps) {
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [currentOnly, setCurrentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const employeeMap = useMemo(
    () =>
      employees.reduce<Record<string, string>>((acc, employee) => {
        acc[employee.id] = `${employee.first_name} ${employee.last_name}`.trim();
        return acc;
      }, {}),
    [employees]
  );

  const { data, count, isLoading } = useApiQuery<Salary[]>("salaries", "/api/salaries", {
    employeeId,
    currentOnly: currentOnly ? "true" : undefined,
    page,
    pageSize
  });
  const rows = data ?? [];
  const loading = isLoading;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const handleExport = async () => {
    const url = buildApiUrl("/api/salaries", {
      employeeId,
      currentOnly: currentOnly ? "true" : undefined,
      page: 1,
      pageSize: 200
    });
    const result = await apiFetch<{ data?: Salary[] }>(url);
    const rows = result.data ?? [];

    downloadCsv(
      rows.map((row: Salary) => ({
        ...row,
        employee_name: employeeMap[row.employee_id ?? ""] ?? "-"
      })),
      [
        { key: "employee_name", label: "Empleado" },
        { key: "base_salary", label: "Sueldo base" },
        { key: "currency", label: "Moneda" },
        { key: "payment_frequency", label: "Frecuencia" },
        { key: "bonuses", label: "Bonos" },
        { key: "deductions", label: "Deducciones" },
        { key: "effective_date", label: "Fecha efectiva" },
        { key: "is_current", label: "Actual" }
      ],
      "sueldos.csv"
    );
  };

  return (
    <Card className="flex flex-1 flex-col md:min-h-[560px]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Sueldos</CardTitle>
          <CardDescription>{count} registros</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="w-full md:w-auto"
        >
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            value={employeeId ?? "all"}
            onValueChange={(value) => {
              setEmployeeId(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Empleado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentOnly ? "current" : "all"}
            onValueChange={(value) => {
              setCurrentOnly(value === "current");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="current">Solo vigentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 md:hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : rows.length === 0
              ? (
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    No hay sueldos con esos filtros.
                  </div>
                )
              : rows.map((salary) => (
                  <div
                    key={salary.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {employeeMap[salary.employee_id ?? ""] ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {salary.currency} {salary.base_salary}
                        </p>
                      </div>
                      <Badge variant={salary.is_current ? "success" : "secondary"}>
                        {salary.is_current ? "Vigente" : "Historico"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Bonos / Deducciones</span>
                        <span className="font-medium text-foreground">
                          {salary.bonuses ?? 0} / {salary.deductions ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Frecuencia</span>
                        <span className="font-medium text-foreground">
                          {salary.payment_frequency ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fecha efectiva</span>
                        <span className="font-medium text-foreground">
                          {formatDate(salary.effective_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
        </div>

        <div className="hidden flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Bonos</TableHead>
                <TableHead>Deducciones</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Fecha efectiva</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No hay sueldos con esos filtros.
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : rows.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{employeeMap[salary.employee_id ?? ""] ?? "-"}</TableCell>
                        <TableCell>
                          {salary.currency} {salary.base_salary}
                        </TableCell>
                        <TableCell>{salary.bonuses ?? 0}</TableCell>
                        <TableCell>{salary.deductions ?? 0}</TableCell>
                        <TableCell>{salary.payment_frequency ?? "-"}</TableCell>
                        <TableCell>{formatDate(salary.effective_date)}</TableCell>
                        <TableCell>
                          <Badge variant={salary.is_current ? "success" : "secondary"}>
                            {salary.is_current ? "Vigente" : "Historico"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Mostrando {rows.length} de {count} registros
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Siguiente
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
