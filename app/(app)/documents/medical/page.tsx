import { EmployeeDocumentsTable } from "@/components/documents/employee-documents-table";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee, EmployeeDocument } from "@/lib/db/employees";

const MEDICAL_TYPES = ["certificado_medico", "certificados_medicos", "medical_certificate"];

export default async function MedicalDocumentsPage() {
  const supabase = await createServerClient();
  const [employeesResponse, documentsResponse] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, email"),
    supabase
      .from("employee_documents")
      .select("id, employee_id, document_name, document_type, file_url, uploaded_at")
      .in("document_type", MEDICAL_TYPES)
      .order("uploaded_at", { ascending: false })
  ]);

  const employees = (employeesResponse.data ?? []) as Pick<
    Employee,
    "id" | "first_name" | "last_name" | "email"
  >[];
  const documents = (documentsResponse.data ?? []) as Pick<
    EmployeeDocument,
    "id" | "employee_id" | "document_name" | "document_type" | "file_url" | "uploaded_at"
  >[];

  return (
    <EmployeeDocumentsTable
      title="Certificados medicos"
      description="Documentos de salud cargados por empleado."
      documents={documents}
      employees={employees}
      emptyMessage="No hay certificados medicos cargados."
      variant="medical"
    />
  );
}
