"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { employeeSchema, type EmployeeSchema } from "@/lib/schemas/employee";
import { uploadEmployeeDocument, uploadProfileImage } from "@/lib/storage/upload";
import { formatDate } from "@/lib/utils/date";
import type { Salary } from "@/lib/db/salaries";
import { apiMutation } from "@/lib/data/cache";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeSchema>;
  employeeId?: string;
  currentSalary?: Salary | null;
}

const companies = ["Engineering", "HR", "Finance", "Sales", "Operations"];
const statuses = [
  { value: "active", label: "Activo" },
  { value: "on_leave", label: "Licencia" },
  { value: "inactive", label: "Desactivado" }
];

export function EmployeeForm({
  defaultValues,
  employeeId,
  currentSalary
}: EmployeeFormProps) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [addSalary, setAddSalary] = useState(!employeeId);
  const [salaryBase, setSalaryBase] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState(currentSalary?.currency ?? "USD");
  const [salaryFrequency, setSalaryFrequency] = useState(
    currentSalary?.payment_frequency ?? "monthly"
  );
  const [salaryBonuses, setSalaryBonuses] = useState("");
  const [salaryDeductions, setSalaryDeductions] = useState("");
  const [salaryEffectiveDate, setSalaryEffectiveDate] = useState("");

  const form = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_number: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      start_date: "",
      vacation_start: "",
      vacation_end: "",
      ...defaultValues,
      status:
        defaultValues?.status === "disabled"
          ? "inactive"
          : defaultValues?.status ?? "active"
    }
  });

  const onSubmit = async (values: EmployeeSchema) => {
    try {
      const normalize = (value?: string | null) => {
        if (typeof value !== "string") {
          return value ?? undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      };

      const payload: EmployeeSchema = {
        employee_number: normalize(values.employee_number),
        first_name: normalize(values.first_name),
        last_name: normalize(values.last_name),
        email: normalize(values.email),
        phone: normalize(values.phone),
        position: normalize(values.position),
        department: normalize(values.department),
        status: normalize(values.status) as EmployeeSchema["status"],
        start_date: normalize(values.start_date),
        end_date: normalize(values.end_date),
        date_of_birth: normalize(values.date_of_birth),
        gender: normalize(values.gender),
        address: normalize(values.address),
        city: normalize(values.city),
        country: normalize(values.country),
        postal_code: normalize(values.postal_code),
        emergency_contact_name: normalize(values.emergency_contact_name),
        emergency_contact_phone: normalize(values.emergency_contact_phone),
        emergency_contact_relationship: normalize(values.emergency_contact_relationship),
        profile_image_url: normalize(values.profile_image_url),
        cv_url: normalize(values.cv_url),
        vacation_start: normalize(values.vacation_start),
        vacation_end: normalize(values.vacation_end)
      };

      const method = employeeId ? "PATCH" : "POST";
      const endpoint = employeeId ? `/api/employees/${employeeId}` : "/api/employees";
      const result = await apiMutation<{ data?: { id?: string } }>(
        endpoint,
        { method, body: payload },
        ["employees"]
      );
      const id = employeeId ?? result.data?.id;
      if (!id) {
        toast.error("No se pudo obtener el ID del empleado");
        return;
      }

      const hasSalaryInput =
        addSalary &&
        [
          salaryBase,
          salaryEffectiveDate,
          salaryBonuses,
          salaryDeductions
        ].some((value) => value.trim().length > 0);

      if (hasSalaryInput) {
        if (!salaryBase.trim() || !salaryEffectiveDate.trim()) {
          toast.error("Completa sueldo y fecha para registrar salario");
        } else {
          const baseValue = Number(salaryBase);
          const bonusesValue = salaryBonuses.trim() ? Number(salaryBonuses) : 0;
          const deductionsValue = salaryDeductions.trim() ? Number(salaryDeductions) : 0;

          if (Number.isNaN(baseValue)) {
            toast.error("El sueldo debe ser numerico");
          } else {
            try {
              await apiMutation(
                "/api/salaries",
                {
                  method: "POST",
                  body: {
                    employee_id: id,
                    base_salary: baseValue,
                    currency: salaryCurrency || "USD",
                    payment_frequency: salaryFrequency || "monthly",
                    bonuses: Number.isNaN(bonusesValue) ? 0 : bonusesValue,
                    deductions: Number.isNaN(deductionsValue) ? 0 : deductionsValue,
                    effective_date: salaryEffectiveDate
                  }
                },
                ["salaries"]
              );
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "No se pudo registrar el sueldo"
              );
            }
          }
        }
      }

      if (profileImage) {
        try {
          const { publicUrl } = await uploadProfileImage(profileImage, id);
          await apiMutation(
            `/api/employees/${id}`,
            { method: "PATCH", body: { profile_image_url: publicUrl } },
            ["employees"]
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo actualizar la foto de perfil"
          );
        }
      }

      if (documentFile) {
        try {
          const { path } = await uploadEmployeeDocument(documentFile, id, "contract");
          await apiMutation(
            `/api/employees/${id}/documents`,
            {
              method: "POST",
              body: {
                document_type: "contract",
                document_name: documentFile.name,
                file_url: path,
                file_size: documentFile.size
              }
            },
            ["employee-documents"]
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el documento"
          );
        }
      }

      toast.success("Empleado guardado");
      router.push(`/employees/${id}`);
    } catch (error) {
      toast.error("No se pudo guardar el empleado");
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="employee_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero de empleado</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP-1024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Analista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Gomez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="maria@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="+54 9 11" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Vacaciones</p>
                  <p className="text-xs text-muted-foreground">
                    Define el periodo y el estado cambiara automaticamente.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vacation_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio vacaciones</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vacation_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin vacaciones</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProfileImage(event.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Documento (contrato/CV)</Label>
                <Input
                  type="file"
                  onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direccion</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Direccion completa" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Sueldo</p>
                  <p className="text-xs text-muted-foreground">
                    Opcional. Agrega un sueldo para incluirlo en el dashboard.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddSalary((prev) => !prev)}
                >
                  {addSalary ? "Ocultar sueldo" : "Agregar sueldo"}
                </Button>
              </div>

              {currentSalary && (
                <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                  <p className="text-xs uppercase text-muted-foreground">Sueldo actual</p>
                  <p className="font-medium">
                    {currentSalary.currency} {currentSalary.base_salary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vigente desde {formatDate(currentSalary.effective_date)}
                  </p>
                </div>
              )}

              {addSalary && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Sueldo base</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={salaryBase}
                        onChange={(event) => setSalaryBase(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha efectiva</Label>
                      <Input
                        type="date"
                        value={salaryEffectiveDate}
                        onChange={(event) => setSalaryEffectiveDate(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Moneda</Label>
                      <Input
                        value={salaryCurrency}
                        onChange={(event) => setSalaryCurrency(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frecuencia</Label>
                      <Select value={salaryFrequency} onValueChange={setSalaryFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="biweekly">Quincenal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Bonos</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={salaryBonuses}
                        onChange={(event) => setSalaryBonuses(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deducciones</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={salaryDeductions}
                        onChange={(event) => setSalaryDeductions(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pais</FormLabel>
                    <FormControl>
                      <Input placeholder="Pais" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codigo postal</FormLabel>
                    <FormControl>
                      <Input placeholder="CP" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genero</FormLabel>
                    <FormControl>
                      <Input placeholder="Genero" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-sm font-semibold">Contacto de emergencia</p>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Contacto" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="+54 9" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relacion</FormLabel>
                      <FormControl>
                        <Input placeholder="Relacion" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Guardar empleado
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
