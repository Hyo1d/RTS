import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { PDFDocument } from "pdf-lib";

async function getReceipt(id: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("salary_receipts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error fetching receipt:", error);
    return null;
  }
  return data;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: receiptId } = await context.params;
  const download = request.nextUrl.searchParams.get("download") === "1";

  if (!receiptId || receiptId === "undefined") {
    return new Response("ID de recibo inválido", { status: 400 });
  }

  const receipt = await getReceipt(receiptId);

  if (!receipt) {
    return new Response("Recibo no encontrado", { status: 404 });
  }

  if (!receipt.receipt_file_url) {
    return new Response("El recibo no tiene un archivo asociado", {
      status: 400,
    });
  }

  if (!receipt.signature_data_url) {
    return new Response("El recibo no esta firmado", { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    const { data: fileData, error: fileError } = await supabase.storage
      .from("salary-receipts")
      .download(receipt.receipt_file_url);

    if (fileError) {
      throw new Error(`Error al descargar el recibo: ${fileError.message}`);
    }

    const pdfDoc = await PDFDocument.load(await fileData.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(receipt.signature_data_url);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    const target = { x: 260, y: 58, width: 166, height: 37 };
    const signatureScale = Math.min(
      target.width / signatureImage.width,
      target.height / signatureImage.height
    );
    const signatureWidth = signatureImage.width * signatureScale;
    const signatureHeight = signatureImage.height * signatureScale;

    const x = Math.max(
      0,
      Math.min(target.x + (target.width - signatureWidth) / 2, pageWidth - signatureWidth)
    );
    const y = Math.max(
      0,
      Math.min(target.y + (target.height - signatureHeight) / 2, pageHeight - signatureHeight)
    );

    firstPage.drawImage(signatureImage, {
      x,
      y,
      width: signatureWidth,
      height: signatureHeight,
    });

    const pdfBytes = await pdfDoc.save();

    const originalName = receipt.original_file_name ?? "recibo.pdf";
    const signedName = originalName.replace(/\.pdf$/i, "_signed.pdf");

    const pdfBytesCopy = new Uint8Array(pdfBytes);
    const pdfBody = new Blob([pdfBytesCopy], { type: "application/pdf" });

    return new Response(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${signedName}"`,
      },
    });
  } catch (error) {
    console.error("Error al procesar el PDF:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return new Response(`Error al procesar el PDF: ${errorMessage}`, {
      status: 500,
    });
  }
}
