import { redirect } from "next/navigation";
import { ReceiptSignature } from "@/components/portal/receipt-signature";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import type { SalaryReceipt } from "@/lib/db/salaries";

interface Params {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function PortalReceiptSignPage({ params }: Params) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidPattern.test(id)) {
    redirect("/portal/receipts");
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
    .from("salary_receipts")
    .select("*")
    .eq("id", id)
    .eq("employee_id", employee.id)
    .single();

  if (error || !data) {
    redirect("/portal/receipts");
  }

  return <ReceiptSignature receipt={data as SalaryReceipt} />;
}
