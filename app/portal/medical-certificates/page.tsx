import { PortalMedicalDocuments } from "@/components/portal/portal-medical-documents";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import type { EmployeeDocument } from "@/lib/db/employees";

const MEDICAL_TYPES = ["certificado_medico", "certificados_medicos", "medical_certificate"];

export default async function PortalMedicalCertificatesPage() {
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
    .from("employee_documents")
    .select("*")
    .eq("employee_id", employee.id)
    .in("document_type", MEDICAL_TYPES)
    .order("uploaded_at", { ascending: false });

  const documents = (data ?? []) as EmployeeDocument[];

  return <PortalMedicalDocuments documents={documents} employeeId={employee.id} />;
}
