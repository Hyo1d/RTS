import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRole } from "@/lib/auth/roles";

const MEDICAL_TYPES = new Set([
  "certificado_medico",
  "certificados_medicos",
  "medical_certificate"
]);

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const employeeIdRaw = formData.get("employee_id");
  const documentTypeRaw = formData.get("document_type");
  const employeeId = typeof employeeIdRaw === "string" ? employeeIdRaw.trim() : "";
  const documentType =
    typeof documentTypeRaw === "string" ? documentTypeRaw.trim() : "";

  if (!employeeId || !documentType || !(file instanceof File)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = isAdminRole(profile?.role);

  if (!isAdmin) {
    if (!MEDICAL_TYPES.has(documentType)) {
      return NextResponse.json(
        { error: "Tipo de documento no permitido" },
        { status: 403 }
      );
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .maybeSingle();

    if (!employee) {
      return NextResponse.json({ error: "Empleado no autorizado" }, { status: 403 });
    }
  }

  const fileExt = file.name.split(".").pop() ?? "bin";
  const fileName = `${employeeId}/${randomUUID()}.${fileExt}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("employee-documents")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path: fileName });
}
