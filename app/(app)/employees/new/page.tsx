import { EmployeeForm } from "@/components/employees/employee-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Completa la informacion base y sube documentos iniciales.
          </p>
        </CardContent>
      </Card>
      <EmployeeForm />
    </div>
  );
}
