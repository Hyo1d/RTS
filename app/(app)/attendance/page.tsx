import { AttendanceForm } from "@/components/attendance/attendance-form";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/db/employees";

export default async function AttendancePage() {
  const supabase = await createServerClient();
  const employeesResponse = await supabase.from("employees").select("*");
  const employees = (employeesResponse.data ?? []) as Employee[];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Asistencias</h2>
          <p className="text-sm text-muted-foreground">
            Control interno de presencia, ausencias y horarios.
          </p>
        </div>
        <AttendanceForm employees={employees} />
      </div>
      <AttendanceTable employees={employees} />
    </div>
  );
}
