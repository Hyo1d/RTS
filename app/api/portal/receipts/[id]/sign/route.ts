import { NextRequest, NextResponse } from "next/server";
import { getPortalContext } from "@/lib/auth/portal";
import { createServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { user, profile, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const signatureDataUrl =
    typeof body.signatureDataUrl === "string" ? body.signatureDataUrl.trim() : "";
  if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Firma invalida" }, { status: 400 });
  }
  const signedName =
    typeof body.signedName === "string" && body.signedName.trim().length > 0
      ? body.signedName.trim()
      : profile?.full_name?.trim() ||
        `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() ||
        user.email;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("salary_receipts")
    .update({
      signed_at: new Date().toISOString(),
      signed_by: profile?.id ?? null,
      signed_name: signedName,
      signature_data_url: signatureDataUrl
    })
    .eq("id", id)
    .eq("employee_id", employee.id)
    .is("signed_at", null)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
