"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Employee, EmployeeDocument } from "@/lib/db/employees";
import type { AttendanceRecord } from "@/lib/db/attendance";
import type { Salary, SalaryReceipt } from "@/lib/db/salaries";
import { apiMutation, useApiQuery } from "@/lib/data/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadEmployeeDocument } from "@/lib/storage/upload";
import { getEffectiveStatus, getStatusLabel } from "@/lib/utils/employee-status";
import { formatDate, formatDateRange } from "@/lib/utils/date";
import { EmployeeAttendance } from "@/components/employees/employee-attendance";
import { SalaryForm } from "@/components/salaries/salary-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface EmployeeProfileProps {
  employee: Employee;
  documents: EmployeeDocument[];
  attendance: AttendanceRecord[];
  salaries: Salary[];
  receipts: SalaryReceipt[];
}

export function EmployeeProfile({
  employee,
  documents,
  attendance,
  salaries,
  receipts
}: EmployeeProfileProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [vacationStart, setVacationStart] = useState(employee.vacation_start ?? "");
  const [vacationEnd, setVacationEnd] = useState(employee.vacation_end ?? "");
  const [savingVacation, setSavingVacation] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("other");
  const [deleting, setDeleting] = useState(false);
  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);
  const effectiveStatus = getEffectiveStatus(employee);
  const { data: documentsData } = useApiQuery<EmployeeDocument[]>(
    "employee-documents",
    `/api/employees/${employee.id}/documents`,
    undefined,
    { fallbackData: { data: documents } }
  );
  const { data: salariesData } = useApiQuery<Salary[]>(
    "salaries",
    "/api/salaries",
    { employeeId: employee.id, pageSize: 200 },
    { fallbackData: { data: salaries } }
  );
  const { data: receiptsData } = useApiQuery<SalaryReceipt[]>(
    "salary-receipts",
    "/api/salary-receipts",
    { employeeId: employee.id, pageSize: 200 },
    { fallbackData: { data: receipts } }
  );
  const docs = documentsData ?? [];
  const salaryRows = salariesData ?? [];
  const receiptRows = receiptsData ?? [];

  const handleSave = async () => {
    try {
      await apiMutation(
        `/api/employees/${employee.id}`,
        { method: "PATCH", body: { phone, email } },
        ["employees"]
      );
      toast.success("Datos actualizados");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
    }
  };

  const handleUpload = async () => {
    if (!docFile) return;
    try {
      const { path } = await uploadEmployeeDocument(docFile, employee.id, docType);
      await apiMutation(
        `/api/employees/${employee.id}/documents`,
        {
          method: "POST",
          body: {
            document_type: docType,
            document_name: docFile.name,
            file_url: path,
            file_size: docFile.size
          }
        },
        ["employee-documents"]
      );
      toast.success("Documento cargado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo cargar el documento"
      );
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Eliminar este empleado? Esta accion no se puede deshacer.")) {
      return;
    }

    setDeleting(true);
    try {
      await apiMutation(
        `/api/employees/${employee.id}`,
        { method: "DELETE" },
        ["employees", "attendance", "salaries", "salary-receipts", "employee-documents"]
      );
      toast.success("Empleado eliminado");
      router.push("/employees");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el empleado"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenReceipt = async (id?: string) => {
    if (!id) {
      toast.error("No hay PDF adjunto");
      return;
    }

    setOpeningReceiptId(id ?? null);
    const response = await fetch(`/api/salary-receipts/${id}/signed-url`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      toast.error("No se pudo abrir el PDF");
      setOpeningReceiptId(null);
      return;
    }

    window.open(payload.url, "_blank", "noopener,noreferrer");
    setOpeningReceiptId(null);
  };

  const handleSaveVacation = async () => {
    if ((vacationStart && !vacationEnd) || (!vacationStart && vacationEnd)) {
      toast.error("Completa inicio y fin de vacaciones");
      return;
    }

    setSavingVacation(true);
    try {
      await apiMutation(
        `/api/employees/${employee.id}`,
        {
          method: "PATCH",
          body: {
            vacation_start: vacationStart || null,
            vacation_end: vacationEnd || null
          }
        },
        ["employees"]
      );
      toast.success("Vacaciones actualizadas");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar vacaciones"
      );
    } finally {
      setSavingVacation(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>
              {employee.first_name} {employee.last_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{employee.position}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
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
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href={`/employees/${employee.id}/edit`}>Editar</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">Email</p>
              {editing ? (
                <Input value={email} onChange={(event) => setEmail(event.target.value)} />
              ) : (
                <p className="text-sm font-medium">{employee.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">Telefono</p>
              {editing ? (
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              ) : (
                <p className="text-sm font-medium">{employee.phone ?? "-"}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Editar rapido
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:inline-flex md:w-auto">
          <TabsTrigger value="info">Informacion Personal</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="attendance">Asistencias</TabsTrigger>
          <TabsTrigger value="salary">Historial Salarial</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card className="space-y-4">
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="text-sm font-medium">{employee.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha inicio</p>
                  <p className="text-sm font-medium">{formatDate(employee.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Direccion</p>
                  <p className="text-sm font-medium">{employee.address ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ciudad</p>
                  <p className="text-sm font-medium">{employee.city ?? "-"}</p>
                </div>
              </div>
            </CardContent>
            <CardContent className="border-t border-border/60 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Vacaciones programadas</p>
                  <p className="text-xs text-muted-foreground">
                    El estado cambia automaticamente dentro del rango.
                  </p>
                </div>
                <Badge variant={effectiveStatus === "vacation" ? "outline" : "secondary"}>
                  {effectiveStatus === "vacation" ? "En vacaciones" : "Fuera de vacaciones"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Inicio</p>
                  <Input
                    type="date"
                    value={vacationStart}
                    onChange={(event) => setVacationStart(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Fin</p>
                  <Input
                    type="date"
                    value={vacationEnd}
                    onChange={(event) => setVacationEnd(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSaveVacation} disabled={savingVacation}>
                  {savingVacation ? "Guardando..." : "Guardar vacaciones"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setVacationStart("");
                    setVacationEnd("");
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="docs">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">Documentos cargados</p>
                  <p className="text-sm text-muted-foreground">
                    Contratos, certificaciones, identificacion
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificado_medico">Certificado medico</SelectItem>
                      <SelectItem value="uniforme">Uniforme</SelectItem>
                      <SelectItem value="contract">Contrato</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="file"
                    onChange={(event) => setDocFile(event.target.files?.[0] ?? null)}
                  />
                  <Button onClick={handleUpload}>Subir</Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-border/60 p-3">
                    <p className="text-sm font-semibold">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attendance">
          <EmployeeAttendance employeeId={employee.id} initialRecords={attendance} />
        </TabsContent>
        <TabsContent value="salary">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Gestion salarial</p>
                <p className="text-xs text-muted-foreground">
                  Registra un nuevo sueldo vigente para este empleado.
                </p>
              </div>
              <SalaryForm
                employees={[employee]}
                defaultEmployeeId={employee.id}
                lockEmployee
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Historial salarial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 md:hidden">
                  {salaryRows.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                      No hay sueldos registrados.
                    </div>
                  ) : (
                    salaryRows.map((salary) => (
                      <div
                        key={salary.id}
                        className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{formatDate(salary.effective_date)}</p>
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
                            <span>Bonos / Deducciones</span>
                            <span className="font-medium text-foreground">
                              {salary.bonuses ?? 0} / {salary.deductions ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha efectiva</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Bonos</TableHead>
                        <TableHead>Deducciones</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No hay sueldos registrados.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        salaryRows.map((salary) => (
                          <TableRow key={salary.id}>
                            <TableCell>{formatDate(salary.effective_date)}</TableCell>
                            <TableCell>
                              {salary.currency} {salary.base_salary}
                            </TableCell>
                            <TableCell>{salary.bonuses ?? 0}</TableCell>
                            <TableCell>{salary.deductions ?? 0}</TableCell>
                            <TableCell>
                              <Badge variant={salary.is_current ? "success" : "secondary"}>
                                {salary.is_current ? "Actual" : "Historico"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recibos de sueldo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 md:hidden">
                  {receiptRows.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                      No hay recibos cargados.
                    </div>
                  ) : (
                    receiptRows.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {formatDateRange(receipt.period_start, receipt.period_end)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pago {formatDate(receipt.payment_date)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              receipt.status === "paid"
                                ? "success"
                                : receipt.status === "pending"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {receipt.status ?? "unknown"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Bruto / Neto</span>
                            <span className="font-medium text-foreground">
                              {receipt.gross_amount} / {receipt.net_amount}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => handleOpenReceipt(receipt.id)}
                          disabled={!receipt.receipt_file_url || openingReceiptId === receipt.id}
                        >
                          {openingReceiptId === receipt.id ? "Abriendo..." : "Ver PDF"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-[820px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Bruto</TableHead>
                        <TableHead>Neto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No hay recibos cargados.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        receiptRows.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            {formatDateRange(receipt.period_start, receipt.period_end)}
                          </TableCell>
                          <TableCell>
                            {formatDate(receipt.payment_date)}
                          </TableCell>
                            <TableCell>{receipt.gross_amount}</TableCell>
                            <TableCell>{receipt.net_amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  receipt.status === "paid"
                                    ? "success"
                                    : receipt.status === "pending"
                                      ? "warning"
                                      : "secondary"
                                }
                              >
                                {receipt.status ?? "unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReceipt(receipt.id)}
                                disabled={!receipt.receipt_file_url || openingReceiptId === receipt.id}
                              >
                                {openingReceiptId === receipt.id ? "Abriendo..." : "Ver PDF"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
