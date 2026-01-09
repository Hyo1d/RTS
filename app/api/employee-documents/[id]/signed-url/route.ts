import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Id requerido" }, { status: 400 });
  }

  const { data: document, error } = await supabase
    .from("employee_documents")
    .select("file_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !document?.file_url) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("employee-documents")
    .createSignedUrl(document.file_url, 60 * 5);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "No se pudo firmar el archivo" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
