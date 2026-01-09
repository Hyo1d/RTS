import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRole } from "@/lib/auth/roles";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminRole(profile?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const employeeIdRaw = formData.get("employee_id");
  const employeeId = typeof employeeIdRaw === "string" ? employeeIdRaw.trim() : "";

  if (!employeeId || !(file instanceof File)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop() ?? "bin";
  const fileName = `${employeeId}/${randomUUID()}.${fileExt}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("salary-receipts")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path: fileName });
}
