"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import type { EmployeeDocument } from "@/lib/db/employees";
import { formatDate } from "@/lib/utils/date";
import { apiMutation } from "@/lib/data/cache";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface UniformSignatureProps {
  document: EmployeeDocument;
  backHref?: string;
}

export function UniformSignature({ document, backHref = "/portal/uniforms" }: UniformSignatureProps) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedAt, setSignedAt] = useState(document.signed_at);
  const [signedName, setSignedName] = useState(document.signed_name);

  const handleSign = async () => {
    if (!signatureDataUrl) {
      toast.error("Dibuja tu firma para continuar");
      return;
    }
    setSubmitting(true);
    try {
      const payload = await apiMutation<{ data?: EmployeeDocument }>(
        `/api/portal/documents/${document.id}/sign`,
        { method: "POST", body: { signatureDataUrl } },
        ["employee-documents"]
      );
      setSignedAt(payload.data?.signed_at ?? new Date().toISOString());
      setSignedName(payload.data?.signed_name ?? signedName);
      toast.success("Uniforme firmado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo firmar el uniforme"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle>Firmar uniforme</CardTitle>
        <CardDescription>
          Documento: {document.document_name} - Fecha {formatDate(document.uploaded_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant={signedAt ? "success" : "secondary"}>
            {signedAt ? "Firmado" : "Pendiente"}
          </Badge>
          {signedAt && (
            <span className="text-muted-foreground">
              {signedName ?? "Empleado"} - {formatDate(signedAt)}
            </span>
          )}
        </div>

        {signedAt ? (
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            Este uniforme ya esta firmado.
          </div>
        ) : (
          <SignaturePad onChange={setSignatureDataUrl} />
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" asChild>
            <Link href={backHref}>Volver</Link>
          </Button>
          {!signedAt && (
            <Button onClick={handleSign} disabled={submitting || !signatureDataUrl}>
              {submitting ? "Firmando..." : "Confirmar firma"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
