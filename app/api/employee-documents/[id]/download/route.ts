import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

function toSafePdfFilename(name?: string | null) {
  const base = (name ?? "documento").trim() || "documento";
  const sanitized = base.replace(/[\\/:*?"<>|]+/g, "_");
  return sanitized.toLowerCase().endsWith(".pdf") ? sanitized : `${sanitized}.pdf`;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return new Response("Id requerido", { status: 400 });
  }

  const { data: document, error } = await supabase
    .from("employee_documents")
    .select("file_url, document_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !document?.file_url) {
    return new Response("Documento no encontrado", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: fileData, error: downloadError } = await admin.storage
    .from("employee-documents")
    .download(document.file_url);

  if (downloadError) {
    return new Response("No se pudo descargar el archivo", { status: 500 });
  }

  const filename = toSafePdfFilename(document.document_name);

  return new Response(fileData, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

