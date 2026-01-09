"use client";

import type { Employee } from "@/lib/db/employees";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeesDatabase } from "@/components/database/employees-database";
import { AttendanceDatabase } from "@/components/database/attendance-database";
import { SalariesDatabase } from "@/components/database/salaries-database";
import { ReceiptsDatabase } from "@/components/database/receipts-database";

interface DatabaseTabsProps {
  employees: Pick<Employee, "id" | "first_name" | "last_name">[];
  supabaseDashboardUrl?: string | null;
}

export function DatabaseTabs({ employees, supabaseDashboardUrl }: DatabaseTabsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Base de datos</h2>
          <p className="text-sm text-muted-foreground">
            Filtra y exporta informacion directo de Supabase.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          disabled={!supabaseDashboardUrl}
          className="w-full md:w-auto"
        >
          <a
            href={supabaseDashboardUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            Abrir Supabase
          </a>
        </Button>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:max-w-2xl md:grid-cols-4">
          <TabsTrigger value="employees">Empleados</TabsTrigger>
          <TabsTrigger value="attendance">Asistencias</TabsTrigger>
          <TabsTrigger value="salaries">Sueldos</TabsTrigger>
          <TabsTrigger value="receipts">Recibos</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
          <EmployeesDatabase />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceDatabase employees={employees} />
        </TabsContent>
        <TabsContent value="salaries">
          <SalariesDatabase employees={employees} />
        </TabsContent>
        <TabsContent value="receipts">
          <ReceiptsDatabase employees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
