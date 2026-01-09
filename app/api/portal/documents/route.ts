import { NextRequest, NextResponse } from "next/server";
import { getPortalContext } from "@/lib/auth/portal";
import { createServerClient } from "@/lib/supabase/server";
import { ensureProfileId } from "@/lib/db/profiles";

const MEDICAL_TYPES = new Set(["certificado_medico", "certificados_medicos", "medical_certificate"]);
const UNIFORM_TYPES = new Set(["uniforme", "uniformes", "uniform"]);

export async function GET(request: NextRequest) {
  const { user, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "").toLowerCase();
  const types =
    type === "medical"
      ? Array.from(MEDICAL_TYPES)
      : type === "uniforms"
        ? Array.from(UNIFORM_TYPES)
        : null;

  const supabase = await createServerClient();
  let query = supabase
    .from("employee_documents")
    .select("*")
    .eq("employee_id", employee.id)
    .order("uploaded_at", { ascending: false });

  if (types) {
    query = query.in("document_type", types);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { user, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const documentType =
    typeof body.document_type === "string" ? body.document_type.trim() : "";
  const documentName =
    typeof body.document_name === "string" ? body.document_name.trim() : "";
  const fileUrl = typeof body.file_url === "string" ? body.file_url.trim() : "";
  const fileSize = Number.isFinite(Number(body.file_size))
    ? Number(body.file_size)
    : undefined;

  if (!documentType || !documentName || !fileUrl) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  if (!MEDICAL_TYPES.has(documentType)) {
    return NextResponse.json(
      { error: "Solo se permiten certificados medicos" },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);
  const { data, error } = await supabase
    .from("employee_documents")
    .insert({
      employee_id: employee.id,
      document_type: documentType,
      document_name: documentName,
      file_url: fileUrl,
      file_size: fileSize,
      uploaded_by: profileId ?? null
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
