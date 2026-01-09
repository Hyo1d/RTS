import { redirect } from "next/navigation";
import { UniformSignature } from "@/components/portal/uniform-signature";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import type { EmployeeDocument } from "@/lib/db/employees";

const UNIFORM_TYPES = ["uniforme", "uniformes", "uniform"];

interface Params {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function PortalUniformSignPage({ params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidPattern.test(id)) {
    redirect("/portal/uniforms");
  }

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
  const { data, error } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("id", id)
    .eq("employee_id", employee.id)
    .in("document_type", UNIFORM_TYPES)
    .single();

  if (error || !data) {
    redirect("/portal/uniforms");
  }

  return <UniformSignature document={data as EmployeeDocument} />;
}
