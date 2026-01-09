"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AttendanceRecord } from "@/lib/db/attendance";
import { formatDate } from "@/lib/utils/date";
import { apiMutation, useApiQuery } from "@/lib/data/cache";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface PortalAttendanceProps {
  records: AttendanceRecord[];
}

const statusOptions = [
  { value: "present", label: "Presente" },
  { value: "absent", label: "Ausente" },
  { value: "late", label: "Tarde" },
  { value: "remote", label: "Remoto" },
  { value: "vacation", label: "Vacaciones" },
  { value: "sick_leave", label: "Licencia" },
  { value: "holiday", label: "Feriado" }
];

const leaveOptions = [
  { value: "sick_leave", label: "Licencia" },
  { value: "vacation", label: "Vacaciones" }
];

export function PortalAttendance({ records }: PortalAttendanceProps) {
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceStatus, setAttendanceStatus] = useState("present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("sick_leave");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [savingLeave, setSavingLeave] = useState(false);
  const { data } = useApiQuery<AttendanceRecord[]>(
    "attendance",
    "/api/portal/attendance",
    { page: 1, pageSize: 200 },
    { fallbackData: { data: records } }
  );
  const rows = data ?? [];

  const sortedRecords = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.attendance_date ?? "").getTime() -
          new Date(a.attendance_date ?? "").getTime()
      ),
    [rows]
  );

  const statusLabel = (status?: string | null) =>
    statusOptions.find((item) => item.value === status)?.label ?? "-";

  const handleAttendanceSubmit = async () => {
    setSavingAttendance(true);
    try {
      await apiMutation(
        "/api/portal/attendance",
        {
          method: "POST",
          body: {
            attendance_date: attendanceDate,
            status: attendanceStatus,
            check_in: checkIn || null,
            check_out: checkOut || null,
            notes: notes || null,
            source: "manual"
          }
        },
        ["attendance"]
      );
      toast.success("Asistencia registrada");
      setNotes("");
      setCheckIn("");
      setCheckOut("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar la asistencia"
      );
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleLeaveSubmit = async () => {
    if (!leaveStart || !leaveEnd) {
      toast.error("Completa las fechas de licencia");
      return;
    }
    setSavingLeave(true);
    try {
      await apiMutation(
        "/api/portal/attendance/leave",
        {
          method: "POST",
          body: {
            start_date: leaveStart,
            end_date: leaveEnd,
            status: leaveStatus,
            notes: leaveNotes || null
          }
        },
        ["attendance"]
      );
      toast.success("Licencia registrada");
      setLeaveNotes("");
      setLeaveStart("");
      setLeaveEnd("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar la licencia"
      );
    } finally {
      setSavingLeave(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fichar asistencia</CardTitle>
            <CardDescription>Registra tu presencia o inasistencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => setAttendanceDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Entrada</Label>
                <Input
                  type="time"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Salida</Label>
                <Input
                  type="time"
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                placeholder="Opcional"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button onClick={handleAttendanceSubmit} disabled={savingAttendance}>
              {savingAttendance ? "Guardando..." : "Registrar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Periodo de licencia</CardTitle>
            <CardDescription>Registra un rango de licencia o vacaciones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={leaveStatus} onValueChange={setLeaveStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {leaveOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Inicio</Label>
                <Input
                  type="date"
                  value={leaveStart}
                  onChange={(event) => setLeaveStart(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={leaveEnd}
                  onChange={(event) => setLeaveEnd(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                placeholder="Opcional"
                value={leaveNotes}
                onChange={(event) => setLeaveNotes(event.target.value)}
              />
            </div>
            <Button onClick={handleLeaveSubmit} disabled={savingLeave}>
              {savingLeave ? "Guardando..." : "Registrar licencia"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {sortedRecords.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                No hay registros cargados.
              </div>
            ) : (
              sortedRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{formatDate(record.attendance_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {statusLabel(record.status)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {record.check_in ?? "-"} / {record.check_out ?? "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No hay registros cargados.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.attendance_date)}</TableCell>
                      <TableCell>{statusLabel(record.status)}</TableCell>
                      <TableCell>{record.check_in ?? "-"}</TableCell>
                      <TableCell>{record.check_out ?? "-"}</TableCell>
                      <TableCell>{record.notes ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
