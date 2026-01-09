import { ReceiptForm } from "@/components/salaries/receipt-form";
import { SalaryForm } from "@/components/salaries/salary-form";
import { SalaryReceiptsTable } from "@/components/salaries/salary-receipts-table";
import { SalaryTable } from "@/components/salaries/salary-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/db/employees";

export default async function SalariesPage() {
  const supabase = await createServerClient();
  const employeesResponse = await supabase.from("employees").select("*");
  const employees = (employeesResponse.data ?? []) as Employee[];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Sueldos</h2>
          <p className="text-sm text-muted-foreground">
            Controla sueldos vigentes, bonos y cambios historicos.
          </p>
        </div>
      </div>
      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="structure">Estructura salarial</TabsTrigger>
          <TabsTrigger value="receipts">Recibos</TabsTrigger>
        </TabsList>
        <TabsContent value="structure" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Sueldos activos y movimientos historicos.
              </p>
            </div>
            <SalaryForm employees={employees} />
          </div>
          <SalaryTable employees={employees} />
        </TabsContent>
        <TabsContent value="receipts" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Recibos por periodo con empleado y estado.
              </p>
            </div>
            <ReceiptForm employees={employees} />
          </div>
          <SalaryReceiptsTable employees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
