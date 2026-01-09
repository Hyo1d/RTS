import { EmployeeProfile } from "@/components/employees/employee-profile";
import { getEmployeeById, getEmployeeDocuments } from "@/lib/db/employees";
import { getAttendanceByEmployee } from "@/lib/db/attendance";
import { getSalaries, getSalaryReceipts } from "@/lib/db/salaries";
import { redirect } from "next/navigation";

interface Params {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidPattern.test(id)) {
    redirect("/employees");
  }
  const employee = await getEmployeeById(id);
  const documents = await getEmployeeDocuments(id);
  const attendance = await getAttendanceByEmployee(id);
  const salaries = await getSalaries(id);
  const receipts = await getSalaryReceipts(id);

  return (
    <EmployeeProfile
      employee={employee}
      documents={documents}
      attendance={attendance}
      salaries={salaries}
      receipts={receipts}
    />
  );
}
