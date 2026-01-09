"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AttendanceRecord } from "@/lib/db/attendance";
import { attendanceSchema, type AttendanceSchema } from "@/lib/schemas/attendance";
import { formatDate } from "@/lib/utils/date";
import { apiMutation, useApiQuery } from "@/lib/data/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface EmployeeAttendanceProps {
  employeeId: string;
  initialRecords?: AttendanceRecord[];
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
const sourceMeta = new Map(sourceOptions.map((item) => [item.value, item]));

const toMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const calcHours = (record: AttendanceRecord) => {
  const start = toMinutes(record.check_in);
  const end = toMinutes(record.check_out);
  if (start === null || end === null) return null;
  const breakMinutes = record.break_minutes ?? 0;
  const total = Math.max(0, end - start - breakMinutes);
  return total / 60;
};

type AttendanceFormSchema = Omit<AttendanceSchema, "employee_id">;

export function EmployeeAttendance({ employeeId, initialRecords }: EmployeeAttendanceProps) {
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data } = useApiQuery<AttendanceRecord[]>(
    "attendance",
    `/api/employees/${employeeId}/attendance`,
    undefined,
    { fallbackData: { data: initialRecords ?? [] } }
  );
  const records = data ?? [];

  const form = useForm<AttendanceFormSchema>({
    resolver: zodResolver(attendanceSchema.omit({ employee_id: true })),
    defaultValues: {
      attendance_date: new Date().toISOString().slice(0, 10),
      status: "present",
      check_in: "",
      check_out: "",
      break_minutes: 0,
      notes: "",
      source: "manual"
    }
  });

  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recent = records.filter((record) => {
      if (!record.attendance_date) return false;
      return new Date(record.attendance_date) >= thirtyDaysAgo;
    });

    const attendedStatuses = new Set(["present", "late", "remote"]);
    const presentCount = recent.filter((record) =>
      attendedStatuses.has(record.status ?? "")
    ).length;
    const lateCount = recent.filter((record) => record.status === "late").length;
    const absentCount = recent.filter((record) => record.status === "absent").length;
    const totalHours = recent.reduce((sum, record) => sum + (calcHours(record) ?? 0), 0);

    return {
      total: recent.length,
      presentCount,
      lateCount,
      absentCount,
      totalHours
    };
  }, [records]);

  const handleSubmit = async (values: AttendanceFormSchema) => {
    setSubmitting(true);
    try {
      await apiMutation(
        `/api/employees/${employeeId}/attendance`,
        {
          method: "POST",
          body: { ...values, employee_id: employeeId }
        },
        ["attendance"]
      );
      toast.success("Asistencia registrada");
      form.reset({
        attendance_date: new Date().toISOString().slice(0, 10),
        status: "present",
        check_in: "",
        check_out: "",
        break_minutes: 0,
        notes: "",
        source: "manual"
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar la asistencia"
      );
    } finally {
      setSubmitting(false);
    }
  };

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
        error instanceof Error ? error.message : "No se pudo eliminar el registro"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen de asistencias</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Horas 30 dias</p>
            <p className="text-lg font-semibold">{metrics.totalHours.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Asistencias</p>
            <p className="text-lg font-semibold">{metrics.presentCount}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Tardanzas</p>
            <p className="text-lg font-semibold">{metrics.lateCount}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Ausencias</p>
            <p className="text-lg font-semibold">{metrics.absentCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-3 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="attendance_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="check_in"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrada</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="check_out"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salida</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="break_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutos descanso</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar asistencia"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="flex flex-col md:min-h-[360px]">
        <CardHeader>
          <CardTitle>Historial de asistencias</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-3 md:hidden">
            {records.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                No hay asistencias registradas.
              </div>
            ) : (
              records.map((record) => {
                const meta = statusMeta.get(record.status ?? "");
                const hours = calcHours(record);
                return (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                      <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatDate(record.attendance_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {sourceMeta.get(record.source ?? "")?.label ?? "-"}
                        </p>
                      </div>
                      <Badge variant={meta?.variant ?? "secondary"}>
                        {meta?.label ?? record.status ?? "-"}
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
              })
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No hay asistencias registradas.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const meta = statusMeta.get(record.status ?? "");
                  const hours = calcHours(record);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.attendance_date)}</TableCell>
                      <TableCell>
                        <Badge variant={meta?.variant ?? "secondary"}>
                          {meta?.label ?? record.status ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{sourceMeta.get(record.source ?? "")?.label ?? "-"}</TableCell>
                      <TableCell>{record.check_in ?? "-"}</TableCell>
                      <TableCell>{record.check_out ?? "-"}</TableCell>
                      <TableCell>{hours !== null ? hours.toFixed(2) : "-"}</TableCell>
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
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
