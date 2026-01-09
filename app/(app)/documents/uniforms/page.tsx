import { EmployeeDocumentsTable } from "@/components/documents/employee-documents-table";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee, EmployeeDocument } from "@/lib/db/employees";

const UNIFORM_TYPES = ["uniforme", "uniformes", "uniform"];

export default async function UniformDocumentsPage() {
  const supabase = await createServerClient();
  const [employeesResponse, documentsResponse] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, email"),
    supabase
      .from("employee_documents")
      .select(
        "id, employee_id, document_name, document_type, file_url, uploaded_at, signed_at, signed_name, signature_data_url"
      )
      .in("document_type", UNIFORM_TYPES)
      .order("uploaded_at", { ascending: false })
  ]);

  const employees = (employeesResponse.data ?? []) as Pick<
    Employee,
    "id" | "first_name" | "last_name" | "email"
  >[];
  const documents = (documentsResponse.data ?? []) as Pick<
    EmployeeDocument,
    | "id"
    | "employee_id"
    | "document_name"
    | "document_type"
    | "file_url"
    | "uploaded_at"
    | "signed_at"
    | "signed_name"
    | "signature_data_url"
  >[];

  return (
    <EmployeeDocumentsTable
      title="Uniformes"
      description="Registros de entrega de uniformes al personal."
      documents={documents}
      employees={employees}
      emptyMessage="No hay documentos de uniformes cargados."
      variant="uniform"
    />
  );
}
