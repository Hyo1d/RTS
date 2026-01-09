"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import type { SalaryReceipt } from "@/lib/db/salaries";
import { formatDate, formatDateRange } from "@/lib/utils/date";
import { useIsMobile } from "@/hooks/useIsMobile";
import { apiMutation, useApiQuery } from "@/lib/data/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/ui/signature-pad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface PortalReceiptsProps {
  receipts: SalaryReceipt[];
  employeeId: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  cancelled: "Cancelado"
};

export function PortalReceipts({ receipts, employeeId }: PortalReceiptsProps) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<"qr" | "draw" | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [origin, setOrigin] = useState("");
  const isMobile = useIsMobile();
  const { data } = useApiQuery<SalaryReceipt[]>(
    "salary-receipts",
    "/api/salary-receipts",
    { employeeId, page: 1, pageSize: 200 },
    { fallbackData: { data: receipts } }
  );
  const rows = data ?? [];

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const pendingCount = useMemo(
    () => rows.filter((receipt) => !receipt.signed_at).length,
    [rows]
  );

  const handleOpenPdf = async (id?: string) => {
    if (!id) {
      toast.error("No hay PDF adjunto");
      return;
    }

    setOpeningId(id ?? null);
    const response = await fetch(`/api/salary-receipts/${id}/signed-url`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      toast.error("No se pudo abrir el PDF");
      setOpeningId(null);
      return;
    }

    window.open(payload.url, "_blank", "noopener,noreferrer");
    setOpeningId(null);
  };

  const signUrl = signingId && origin ? `${origin}/portal/sign/receipts/${signingId}` : "";

  const openSignDialog = (receipt: SalaryReceipt) => {
    setSigningId(receipt.id);
    setSignMode(isMobile ? "draw" : "qr");
    setSignatureDataUrl(null);
  };

  const closeSignDialog = () => {
    setSigningId(null);
    setSignMode(null);
    setSignatureDataUrl(null);
  };

  const handleSign = async () => {
    if (!signingId) return;
    if (!signatureDataUrl) {
      toast.error("Dibuja tu firma para continuar");
      return;
    }
    setSubmitting(true);
    try {
      await apiMutation(
        `/api/portal/receipts/${signingId}/sign`,
        { method: "POST", body: { signatureDataUrl } },
        ["salary-receipts"]
      );
      toast.success("Recibo firmado");
      closeSignDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo firmar el recibo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!signUrl) return;
    try {
      await navigator.clipboard.writeText(signUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <Dialog open={Boolean(signingId)} onOpenChange={(open) => !open && closeSignDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Firmar recibo</DialogTitle>
            <DialogDescription>
              {signMode === "qr"
                ? "Escanea el QR desde tu celular para firmar con el dedo."
                : "Dibuja tu firma con el dedo para confirmar."}
            </DialogDescription>
          </DialogHeader>
          {signMode === "qr" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              {signUrl ? (
                <QRCodeSVG value={signUrl} size={220} />
              ) : (
                <div className="rounded-lg border border-border/60 bg-muted/40 px-6 py-4 text-xs text-muted-foreground">
                  Generando enlace...
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Abri este link en el telefono si no podes escanear.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={handleCopyLink}>
                  Copiar link
                </Button>
                {signUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(signUrl, "_blank", "noopener,noreferrer")}
                  >
                    Abrir en celular
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <SignaturePad key={signingId ?? "signature"} onChange={setSignatureDataUrl} />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeSignDialog}>
              Cerrar
            </Button>
            {signMode === "draw" && (
              <Button
                type="button"
                onClick={handleSign}
                disabled={submitting || !signatureDataUrl}
              >
                {submitting ? "Firmando..." : "Confirmar firma"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Recibos de sueldo</CardTitle>
          <CardDescription>
            {rows.length} recibos | {pendingCount} sin firma
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="space-y-3 md:hidden">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
              No hay recibos disponibles.
            </div>
          ) : (
            rows.map((receipt) => (
              <div
                key={receipt.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {formatDateRange(receipt.period_start, receipt.period_end)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pago: {formatDate(receipt.payment_date)}
                    </p>
                  </div>
                  <Badge variant={receipt.signed_at ? "success" : "secondary"}>
                    {receipt.signed_at ? "Firmado" : "Pendiente"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Estado</span>
                    <span className="font-medium text-foreground">
                      {statusLabels[receipt.status ?? "pending"] ?? "Pendiente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Neto</span>
                    <span className="font-medium text-foreground">
                      {receipt.net_amount}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPdf(receipt.id)}
                      disabled={!receipt.receipt_file_url || openingId === receipt.id}
                    >
                    {openingId === receipt.id ? "Abriendo..." : "Ver recibo"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openSignDialog(receipt)}
                    disabled={Boolean(receipt.signed_at)}
                  >
                    {receipt.signed_at ? "Recibo firmado" : "Firmar recibo"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Neto</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No hay recibos disponibles.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      {formatDateRange(receipt.period_start, receipt.period_end)}
                    </TableCell>
                    <TableCell>{formatDate(receipt.payment_date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {statusLabels[receipt.status ?? "pending"] ?? "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{receipt.net_amount}</TableCell>
                    <TableCell>
                      <Badge variant={receipt.signed_at ? "success" : "secondary"}>
                        {receipt.signed_at ? "Firmado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPdf(receipt.id)}
                          disabled={!receipt.receipt_file_url || openingId === receipt.id}
                        >
                          {openingId === receipt.id ? "Abriendo..." : "Ver recibo"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openSignDialog(receipt)}
                          disabled={Boolean(receipt.signed_at)}
                        >
                          {receipt.signed_at ? "Firmado" : "Firmar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
