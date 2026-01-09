import { EmployeeForm } from "@/components/employees/employee-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmployeeById } from "@/lib/db/employees";
import { getSalaries } from "@/lib/db/salaries";
import type { EmployeeSchema } from "@/lib/schemas/employee";
import { redirect } from "next/navigation";

interface Params {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function EditEmployeePage({ params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidPattern.test(id)) {
    redirect("/employees");
  }
  const employee = await getEmployeeById(id);
  const salaries = await getSalaries(employee.id);
  const currentSalary =
    salaries.find((salary) => salary.is_current) ?? salaries[0] ?? null;

  const defaultValues: Partial<EmployeeSchema> = {
    employee_number: employee.employee_number,
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone ?? null,
    position: employee.position,
    department: employee.department,
    status: employee.status ?? "active",
    start_date: employee.start_date,
    end_date: employee.end_date ?? null,
    date_of_birth: employee.date_of_birth ?? null,
    gender: employee.gender ?? null,
    address: employee.address ?? null,
    city: employee.city ?? null,
    country: employee.country ?? null,
    postal_code: employee.postal_code ?? null,
    emergency_contact_name: employee.emergency_contact_name ?? null,
    emergency_contact_phone: employee.emergency_contact_phone ?? null,
    emergency_contact_relationship: employee.emergency_contact_relationship ?? null,
    profile_image_url: employee.profile_image_url ?? null,
    cv_url: employee.cv_url ?? null,
    vacation_start: employee.vacation_start ?? null,
    vacation_end: employee.vacation_end ?? null
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Actualiza los datos del empleado y guarda los cambios.
          </p>
        </CardContent>
      </Card>
      <EmployeeForm
        defaultValues={defaultValues}
        employeeId={employee.id}
        currentSalary={currentSalary}
      />
    </div>
  );
}
