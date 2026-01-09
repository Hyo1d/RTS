import { PortalAttendance } from "@/components/portal/portal-attendance";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import type { AttendanceRecord } from "@/lib/db/attendance";

export default async function PortalAttendancePage() {
  const { user, employee } = await getPortalContext();

  if (!user) {
    return null;
  }

  if (!employee) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-sm text-muted-foreground">
        No hay un empleado vinculado a tu cuenta. Contacta al administrador.
      </div>
    );
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employee.id)
    .order("attendance_date", { ascending: false })
    .limit(90);

  const records = (data ?? []) as AttendanceRecord[];

  return <PortalAttendance records={records} />;
}
