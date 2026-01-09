"use client";

import { useMemo } from "react";
import type { Employee } from "@/lib/db/employees";
import { useSalaries } from "@/hooks/useSalaries";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface SalaryTableProps {
  employees: Employee[];
}

export function SalaryTable({ employees }: SalaryTableProps) {
  const { data, loading } = useSalaries();

  const employeeMap = employees.reduce<Record<string, string>>((acc, employee) => {
    acc[employee.id] = `${employee.first_name} ${employee.last_name}`;
    return acc;
  }, {});

  const currentCount = useMemo(
    () => data.filter((salary) => salary.is_current).length,
    [data]
  );
  const averageSalary = useMemo(() => {
    const current = data.filter((salary) => salary.is_current);
    if (current.length === 0) return 0;
    const total = current.reduce(
      (sum, salary) => sum + Number(salary.base_salary ?? 0),
      0
    );
    return total / current.length;
  }, [data]);

  return (
    <Card className="flex flex-1 flex-col md:min-h-[520px]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Listado salarial</CardTitle>
          <CardDescription>
            {currentCount} salarios vigentes | Promedio {averageSalary.toFixed(2)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
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
            : data.length === 0
              ? (
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    No hay sueldos registrados.
                  </div>
                )
              : data.map((salary) => (
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
                        {salary.is_current ? "Actual" : "Historico"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Frecuencia</span>
                        <span className="font-medium text-foreground">
                          {salary.payment_frequency ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
        </div>

        <div className="hidden flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Sueldo base</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                            <p>No hay sueldos registrados.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : data.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>{employeeMap[salary.employee_id ?? ""] ?? "-"}</TableCell>
                        <TableCell>
                          {salary.currency} {salary.base_salary}
                        </TableCell>
                        <TableCell>{salary.payment_frequency}</TableCell>
                        <TableCell>
                          <Badge variant={salary.is_current ? "success" : "secondary"}>
                            {salary.is_current ? "Actual" : "Historico"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data.length} registros totales
        </p>
      </CardFooter>
    </Card>
  );
}
