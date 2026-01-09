import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

function toSafePdfFilename(name?: string | null) {
  const base = (name ?? "recibo").trim() || "recibo";
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

  const { data: receipt, error } = await supabase
    .from("salary_receipts")
    .select("receipt_file_url, original_file_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !receipt?.receipt_file_url) {
    return new Response("Recibo no encontrado", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: fileData, error: downloadError } = await admin.storage
    .from("salary-receipts")
    .download(receipt.receipt_file_url);

  if (downloadError) {
    return new Response("No se pudo descargar el PDF", { status: 500 });
  }

  const filename = toSafePdfFilename(receipt.original_file_name ?? "recibo.pdf");

  return new Response(fileData, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

