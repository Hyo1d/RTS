"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getEffectiveStatus, getStatusLabel } from "@/lib/utils/employee-status";

const companies = ["Engineering", "HR", "Finance", "Sales", "Operations"];
const statuses = [
  { value: "active", label: "Activo" },
  { value: "on_leave", label: "Licencia" },
  { value: "vacation", label: "Vacaciones" },
  { value: "inactive", label: "Desactivado" }
];

export function EmployeeTable() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, count, loading } = useEmployees({
    search: debouncedSearch,
    department,
    status,
    page
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 10)), [count]);
  const activeCount = useMemo(
    () =>
      data.filter((employee) => getEffectiveStatus(employee) === "active").length,
    [data]
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminar este empleado?")) {
      return;
    }

    setDeletingId(id);
    try {
      await apiMutation(`/api/employees/${id}`, { method: "DELETE" }, ["employees"]);
      toast.success("Empleado eliminado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el empleado"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="flex flex-1 flex-col md:min-h-[560px]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Listado de empleados</CardTitle>
          <CardDescription>
            {count} en total | {activeCount} activos
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="w-full md:w-auto" asChild>
          <Link href="/employees/new">Nuevo empleado</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o numero"
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={department ?? "all"}
              onValueChange={(value) => {
                setDepartment(value === "all" ? undefined : value);
                setPage(1);
              }}
            >
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
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
        </div>

        <div className="space-y-3 md:hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))
            : data.length === 0
              ? (
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    <p>No hay empleados con esos filtros.</p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link href="/employees/new">Crear empleado</Link>
                    </Button>
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
                          <p className="text-xs text-muted-foreground">
                            {employee.email ?? "-"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            #{employee.employee_number ?? "-"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            effectiveStatus === "active"
                              ? "success"
                              : effectiveStatus === "vacation"
                                ? "outline"
                                : effectiveStatus === "on_leave"
                                  ? "secondary"
                                  : "destructive"
                          }
                        >
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
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/employees/${employee.id}`}>Ver</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/employees/${employee.id}/edit`}>Editar</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="col-span-2"
                          onClick={() => handleDelete(employee.id)}
                          disabled={deletingId === employee.id}
                        >
                          {deletingId === employee.id ? "Eliminando..." : "Eliminar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
        </div>

        <div className="hidden flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                            <p>No hay empleados con esos filtros.</p>
                            <Button size="sm" asChild>
                              <Link href="/employees/new">Crear empleado</Link>
                            </Button>
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
                          <Badge
                            variant={
                              effectiveStatus === "active"
                                ? "success"
                                : effectiveStatus === "vacation"
                                  ? "outline"
                                  : effectiveStatus === "on_leave"
                                    ? "secondary"
                                    : "destructive"
                            }
                          >
                            {getStatusLabel(effectiveStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/employees/${employee.id}`}>Ver</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/employees/${employee.id}/edit`}>Editar</Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                              disabled={deletingId === employee.id}
                            >
                              {deletingId === employee.id ? "Eliminando..." : "Eliminar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
            </TableBody>
          </Table>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Mostrando {data.length} de {count} empleados
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
