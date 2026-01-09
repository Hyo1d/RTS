import { ReceiptForm } from "@/components/salaries/receipt-form";
import { SalaryReceiptsTable } from "@/components/salaries/salary-receipts-table";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/db/employees";

export default async function ReceiptsDocumentsPage() {
  const supabase = await createServerClient();
  const employeesResponse = await supabase.from("employees").select("*");
  const employees = (employeesResponse.data ?? []) as Employee[];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Recibos de sueldo</h2>
          <p className="text-sm text-muted-foreground">
            Genera recibos por periodo con su empleado correspondiente.
          </p>
        </div>
        <ReceiptForm employees={employees} />
      </div>
      <SalaryReceiptsTable employees={employees} />
    </div>
  );
}
