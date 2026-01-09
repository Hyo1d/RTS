"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import type { SalaryReceipt } from "@/lib/db/salaries";
import { formatDate, formatDateRange } from "@/lib/utils/date";
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

interface ReceiptSignatureProps {
  receipt: SalaryReceipt;
  backHref?: string;
}

export function ReceiptSignature({ receipt, backHref = "/portal/receipts" }: ReceiptSignatureProps) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedAt, setSignedAt] = useState(receipt.signed_at);
  const [signedName, setSignedName] = useState(receipt.signed_name);

  const handleSign = async () => {
    if (!signatureDataUrl) {
      toast.error("Dibuja tu firma para continuar");
      return;
    }
    setSubmitting(true);
    try {
      const payload = await apiMutation<{ data?: SalaryReceipt }>(
        `/api/portal/receipts/${receipt.id}/sign`,
        { method: "POST", body: { signatureDataUrl } },
        ["salary-receipts"]
      );
      setSignedAt(payload.data?.signed_at ?? new Date().toISOString());
      setSignedName(payload.data?.signed_name ?? signedName);
      toast.success("Recibo firmado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo firmar el recibo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle>Firmar recibo</CardTitle>
        <CardDescription>
          Periodo {formatDateRange(receipt.period_start, receipt.period_end)} - Pago{" "}
          {formatDate(receipt.payment_date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant={signedAt ? "success" : "secondary"}>
            {signedAt ? "Firmado" : "Pendiente"}
          </Badge>
          <span className="text-muted-foreground">Neto: {receipt.net_amount}</span>
          {signedAt && (
            <span className="text-muted-foreground">
              {signedName ?? "Empleado"} - {formatDate(signedAt)}
            </span>
          )}
        </div>

        {signedAt ? (
          <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
            Este recibo ya esta firmado.
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
