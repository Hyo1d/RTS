import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  FileText,
  UserCheck,
  UserMinus,
  Users
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/db/employees";
import type { Salary } from "@/lib/db/salaries";
import { getEffectiveStatus } from "@/lib/utils/employee-status";
import { getMedicalCertificateStatus } from "@/lib/utils/medical-certificates";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const [
    employeesResponse,
    salariesResponse,
    receiptsResponse,
    uniformsResponse,
    medicalResponse
  ] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, first_name, last_name, department, position, status, start_date, date_of_birth, created_at, vacation_start, vacation_end"
      ),
    supabase
      .from("salaries")
      .select("employee_id, base_salary, bonuses, deductions, is_current")
      .eq("is_current", true),
    supabase.from("salary_receipts").select("id, signed_at"),
    supabase
      .from("employee_documents")
      .select("id, employee_id, signed_at")
      .in("document_type", ["uniforme", "uniformes", "uniform"]),
    supabase
      .from("employee_documents")
      .select("id, employee_id, uploaded_at")
      .in("document_type", ["certificado_medico", "certificados_medicos", "medical_certificate"])
  ]);
  const employees = (employeesResponse.data ?? []) as Employee[];
  const salaries = (salariesResponse.data ?? []) as Salary[];
  const receipts = receiptsResponse.data ?? [];
  const uniforms = uniformsResponse.data ?? [];
  const medicalDocuments = medicalResponse.data ?? [];

  const effectiveStatuses = employees.map((employee) => getEffectiveStatus(employee));
  const totalEmployees = employees.filter(
    (employee) => getEffectiveStatus(employee) !== "inactive"
  ).length;
  const activeEmployees = effectiveStatuses.filter((status) => status === "active").length;
  const vacationEmployees = effectiveStatuses.filter((status) => status === "vacation").length;
  const onLeaveEmployees = effectiveStatuses.filter((status) => status === "on_leave").length;
  const baseTotal = salaries.reduce((sum, salary) => sum + Number(salary.base_salary ?? 0), 0);
  const bonusesTotal = salaries.reduce((sum, salary) => sum + Number(salary.bonuses ?? 0), 0);
  const deductionsTotal = salaries.reduce(
    (sum, salary) => sum + Number(salary.deductions ?? 0),
    0
  );
  const monthlyPayroll = salaries.reduce((sum, salary) => {
    const base = Number(salary.base_salary ?? 0);
    const bonuses = Number(salary.bonuses ?? 0);
    const deductions = Number(salary.deductions ?? 0);
    return sum + base + bonuses - deductions;
  }, 0);
  const currentSalaryEmployeeIds = new Set(
    salaries.map((salary) => salary.employee_id).filter(Boolean)
  );
  const employeesWithoutSalary = employees.filter(
    (employee) =>
      getEffectiveStatus(employee) !== "inactive" &&
      !currentSalaryEmployeeIds.has(employee.id)
  ).length;
  const salaryCount = currentSalaryEmployeeIds.size;
  const avgPayroll = salaryCount > 0 ? monthlyPayroll / salaryCount : 0;
  const pendingReceipts = receipts.filter((receipt) => !receipt.signed_at).length;
  const pendingUniforms = uniforms.filter((doc) => !doc.signed_at).length;
  const medicalByEmployee = new Map<string, { uploaded_at?: string | null }>();
  for (const doc of medicalDocuments) {
    if (!doc.employee_id) continue;
    const existing = medicalByEmployee.get(doc.employee_id);
    if (!existing) {
      medicalByEmployee.set(doc.employee_id, doc);
      continue;
    }
    const existingDate = existing.uploaded_at ? new Date(existing.uploaded_at) : null;
    const nextDate = doc.uploaded_at ? new Date(doc.uploaded_at) : null;
    if (nextDate && (!existingDate || nextDate > existingDate)) {
      medicalByEmployee.set(doc.employee_id, doc);
    }
  }
  let medicalMissing = 0;
  let medicalExpired = 0;
  for (const employee of employees) {
    const doc = medicalByEmployee.get(employee.id);
    const status = getMedicalCertificateStatus(doc?.uploaded_at);
    if (status === "missing") {
      medicalMissing += 1;
    } else if (status === "expired") {
      medicalExpired += 1;
    }
  }
  const pendingMedical = medicalMissing + medicalExpired;

  return (
    <div className="flex flex-col gap-6">
      <div className="scrollbar-hide -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4">
        <MetricCard
          label="Total empleados"
          value={String(totalEmployees)}
          className="min-w-[220px] shrink-0 snap-start md:min-w-0 md:shrink"
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <MetricCard
          label="Activos"
          value={String(activeEmployees)}
          className="min-w-[220px] shrink-0 snap-start md:min-w-0 md:shrink"
          icon={<UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <MetricCard
          label="Vacaciones"
          value={String(vacationEmployees)}
          className="min-w-[220px] shrink-0 snap-start md:min-w-0 md:shrink"
          icon={<CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <MetricCard
          label="Licencias"
          value={String(onLeaveEmployees)}
          className="min-w-[220px] shrink-0 snap-start md:min-w-0 md:shrink"
          icon={<UserMinus className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones rapidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/employees/new">
                  <Users className="h-4 w-4" />
                  Nuevo empleado
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/attendance">
                  <CalendarCheck className="h-4 w-4" />
                  Registrar asistencia
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/documents/receipts">
                  <FileText className="h-4 w-4" />
                  Nuevo recibo
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Costos salariales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Base total</p>
                  <p className="text-lg font-semibold">${baseTotal.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Bonos</p>
                  <p className="text-lg font-semibold">${bonusesTotal.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Deducciones</p>
                  <p className="text-lg font-semibold text-destructive">
                    -${deductionsTotal.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Costo neto</p>
                  <p className="text-lg font-semibold">${monthlyPayroll.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Promedio por empleado</p>
                  <p className="text-xs text-muted-foreground">
                    Basado en sueldos vigentes
                  </p>
                </div>
                <span className="text-sm font-semibold">${avgPayroll.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Recibos por firmar</p>
                  <p className="text-xs text-muted-foreground">
                    Pendientes de empleados
                  </p>
                </div>
                <span className="text-sm font-semibold">{pendingReceipts}</span>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Uniformes por firmar</p>
                  <p className="text-xs text-muted-foreground">
                    Entregas pendientes
                  </p>
                </div>
                <span className="text-sm font-semibold">{pendingUniforms}</span>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Certificados medicos</p>
                  <p className="text-xs text-muted-foreground">
                    Vencidos: {medicalExpired} - Sin cargar: {medicalMissing}
                  </p>
                </div>
                <span className="text-sm font-semibold">{pendingMedical}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents/receipts">Ver recibos</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents/uniforms">Ver uniformes</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents/medical">Ver certificados</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Resumen operativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Estado de plantilla</p>
                <p className="text-xs text-muted-foreground">Activos, vacaciones y licencias</p>
              </div>
              <span className="text-sm font-semibold">
                {activeEmployees}/{vacationEmployees}/{onLeaveEmployees}
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Nomina mensual</p>
                <p className="text-xs text-muted-foreground">Sueldos vigentes</p>
              </div>
              <span className="text-sm font-semibold">
                ${monthlyPayroll.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Sin sueldo</p>
                  <p className="text-xs text-muted-foreground">Pendientes de carga</p>
                </div>
              </div>
              <span className="text-sm font-semibold">{employeesWithoutSalary}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
