"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/lib/db/employees";
import { useAttendanceRecords } from "@/hooks/useAttendanceRecords";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { apiMutation } from "@/lib/data/cache";
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

interface AttendanceTableProps {
  employees: Employee[];
}

const statusOptions = [
  { value: "present", label: "Presente", variant: "success" as const },
  { value: "late", label: "Tarde", variant: "warning" as const },
  { value: "remote", label: "Remoto", variant: "secondary" as const },
  { value: "vacation", label: "Vacaciones", variant: "secondary" as const },
  { value: "sick_leave", label: "Enfermo", variant: "secondary" as const },
  { value: "holiday", label: "Feriado", variant: "secondary" as const },
  { value: "absent", label: "Ausente", variant: "destructive" as const }
];

const sourceOptions = [
  { value: "manual", label: "Manual" },
  { value: "import", label: "Importado" },
  { value: "correction", label: "Correccion" }
];

const statusMeta = new Map(statusOptions.map((item) => [item.value, item]));
const sourceMeta = new Map(sourceOptions.map((item) => [item.value, item.label]));

const toMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const calcHours = (checkIn?: string | null, checkOut?: string | null, breakMinutes?: number | null) => {
  const start = toMinutes(checkIn);
  const end = toMinutes(checkOut);
  if (start === null || end === null) return null;
  const total = Math.max(0, end - start - (breakMinutes ?? 0));
  return total / 60;
};

export function AttendanceTable({ employees }: AttendanceTableProps) {
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pageSize = 10;
  const { data, count, loading } = useAttendanceRecords({
    employeeId,
    status,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  const employeeMap = useMemo(() => {
    return employees.reduce<Record<string, string>>((acc, employee) => {
      acc[employee.id] = `${employee.first_name} ${employee.last_name}`.trim();
      return acc;
    }, {});
  }, [employees]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminar este registro?")) {
      return;
    }

    setDeletingId(id);
    try {
      await apiMutation(`/api/attendance/${id}`, { method: "DELETE" }, ["attendance"]);
      toast.success("Registro eliminado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar la asistencia"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetFilters = () => {
    setEmployeeId(undefined);
    setStatus(undefined);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <Card className="flex flex-1 flex-col md:min-h-[520px]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Listado de asistencias</CardTitle>
          <CardDescription>{count} registros</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetFilters}>
          Limpiar filtros
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
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
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
          />
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
                    No hay asistencias con esos filtros.
                  </div>
                )
              : data.map((record) => {
                  const status = statusMeta.get(record.status ?? "");
                  const hours = calcHours(record.check_in, record.check_out, record.break_minutes);
                  return (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {employeeMap[record.employee_id ?? ""] ?? "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.attendance_date)}
                          </p>
                        </div>
                        <Badge variant={status?.variant ?? "secondary"}>
                          {status?.label ?? record.status ?? "-"}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Entrada / Salida</span>
                          <span className="font-medium text-foreground">
                            {record.check_in ?? "-"} - {record.check_out ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Horas</span>
                          <span className="font-medium text-foreground">
                            {hours !== null ? hours.toFixed(2) : "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Fuente</span>
                          <span className="font-medium text-foreground">
                            {sourceMeta.get(record.source ?? "") ?? "-"}
                          </span>
                        </div>
                      </div>
                      {record.notes && (
                        <p className="mt-3 text-xs text-muted-foreground">{record.notes}</p>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                      >
                        {deletingId === record.id ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
                  );
                })}
        </div>

        <div className="hidden flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No hay asistencias con esos filtros.
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : data.map((record) => {
                      const status = statusMeta.get(record.status ?? "");
                      const hours = calcHours(record.check_in, record.check_out, record.break_minutes);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{employeeMap[record.employee_id ?? ""] ?? "-"}</TableCell>
                          <TableCell>{formatDate(record.attendance_date)}</TableCell>
                          <TableCell>
                            <Badge variant={status?.variant ?? "secondary"}>
                              {status?.label ?? record.status ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.check_in ?? "-"}</TableCell>
                          <TableCell>{record.check_out ?? "-"}</TableCell>
                          <TableCell>{hours !== null ? hours.toFixed(2) : "-"}</TableCell>
                          <TableCell>{sourceMeta.get(record.source ?? "") ?? "-"}</TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {record.notes ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              disabled={deletingId === record.id}
                            >
                              {deletingId === record.id ? "Eliminando..." : "Eliminar"}
                            </Button>
                          </TableCell>
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
