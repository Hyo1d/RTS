import { PortalReceipts } from "@/components/portal/portal-receipts";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import type { SalaryReceipt } from "@/lib/db/salaries";

export default async function PortalReceiptsPage() {
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
    .from("salary_receipts")
    .select("*")
    .eq("employee_id", employee.id)
    .order("payment_date", { ascending: false });

  const receipts = (data ?? []) as SalaryReceipt[];
  return <PortalReceipts receipts={receipts} employeeId={employee.id} />;
}
