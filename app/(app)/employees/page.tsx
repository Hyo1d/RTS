import Link from "next/link";
import { EmployeeTable } from "@/components/employees/employee-table";
import { Button } from "@/components/ui/button";

export default function EmployeesPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Empleados</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona altas, datos personales y estado laboral.
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/employees/new">Nuevo empleado</Link>
        </Button>
      </div>
      <EmployeeTable />
    </div>
  );
}
