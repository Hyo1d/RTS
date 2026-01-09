"use client";

import { useMemo, useState } from "react";
import { getEffectiveStatus, getStatusLabel } from "@/lib/utils/employee-status";
import { downloadCsv } from "@/lib/utils/csv";
import { formatDate, formatDateRange } from "@/lib/utils/date";
import { useEmployees } from "@/hooks/useEmployees";
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
import { Input } from "@/components/ui/input";
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

const companies = ["Engineering", "HR", "Finance", "Sales", "Operations"];
const statuses = [
  { value: "active", label: "Activo" },
  { value: "vacation", label: "Vacaciones" },
  { value: "on_leave", label: "Licencia" },
  { value: "inactive", label: "Desactivado" }
];

export function EmployeesDatabase() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, count, loading } = useEmployees({
    search,
    department,
    status,
    page,
    pageSize
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (department) params.set("department", department);
    if (status) params.set("status", status);
    params.set("page", "1");
    params.set("pageSize", "200");

    const response = await fetch(`/api/employees?${params.toString()}`);
    if (!response.ok) return;
    const result = await response.json();
    const rows = (result.data ?? []) as typeof data;

    downloadCsv(
      rows.map((row) => ({
        ...row,
        effective_status: getStatusLabel(getEffectiveStatus(row))
      })),
      [
        { key: "employee_number", label: "Numero" },
        { key: "first_name", label: "Nombre" },
        { key: "last_name", label: "Apellido" },
        { key: "email", label: "Email" },
        { key: "department", label: "Empresa" },
        { key: "position", label: "Cargo" },
        { key: "effective_status", label: "Estado" },
        { key: "vacation_start", label: "Vacaciones inicio" },
        { key: "vacation_end", label: "Vacaciones fin" },
        { key: "start_date", label: "Fecha ingreso" }
      ],
      "empleados.csv"
    );
  };

  return (
    <Card className="flex flex-1 flex-col md:min-h-[560px]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Empleados</CardTitle>
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
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <Input
            placeholder="Buscar por nombre o email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Select
            value={department ?? "all"}
            onValueChange={(value) => {
              setDepartment(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status ?? "all"}
            onValueChange={(value) => {
              setStatus(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statuses.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
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
            : data.length === 0
              ? (
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    No hay empleados con esos filtros.
                  </div>
                )
              : data.map((employee) => {
                  const effectiveStatus = getEffectiveStatus(employee);
                  return (
                    <div
                      key={employee.id}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {employee.first_name ?? "-"} {employee.last_name ?? ""}
                          </p>
                          <p className="text-xs text-muted-foreground">{employee.email ?? "-"}</p>
                        </div>
                        <Badge variant={effectiveStatus === "active" ? "success" : "secondary"}>
                          {getStatusLabel(effectiveStatus)}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Empresa</span>
                          <span className="font-medium text-foreground">
                            {employee.department ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Cargo</span>
                          <span className="font-medium text-foreground">
                            {employee.position ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Vacaciones</span>
                          <span className="font-medium text-foreground">
                            {formatDateRange(employee.vacation_start, employee.vacation_end)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
        </div>

        <div className="hidden flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vacaciones</TableHead>
                <TableHead>Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No hay empleados con esos filtros.
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : data.map((employee) => {
                      const effectiveStatus = getEffectiveStatus(employee);
                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">
                                {employee.first_name ?? "-"} {employee.last_name ?? ""}
                              </p>
                              <p className="text-xs text-muted-foreground">{employee.email ?? "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department ?? "-"}</TableCell>
                          <TableCell>{employee.position ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant={effectiveStatus === "active" ? "success" : "secondary"}>
                              {getStatusLabel(effectiveStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateRange(employee.vacation_start, employee.vacation_end)}
                          </TableCell>
                          <TableCell>{formatDate(employee.start_date)}</TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Mostrando {data.length} de {count} registros
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
