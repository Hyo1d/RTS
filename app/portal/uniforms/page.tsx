import { PortalUniforms } from "@/components/portal/portal-uniforms";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import type { EmployeeDocument } from "@/lib/db/employees";

const UNIFORM_TYPES = ["uniforme", "uniformes", "uniform"];

export default async function PortalUniformsPage() {
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
    .in("document_type", UNIFORM_TYPES)
    .order("uploaded_at", { ascending: false });

  const documents = (data ?? []) as EmployeeDocument[];
  return <PortalUniforms documents={documents} />;
}
