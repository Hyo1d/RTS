import { NextRequest, NextResponse } from "next/server";
import { getPortalContext } from "@/lib/auth/portal";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { user, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const supabase = await createServerClient();
  let query = supabase
    .from("salary_receipts")
    .select("*")
    .eq("employee_id", employee.id)
    .order("payment_date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
