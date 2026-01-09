"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import type { EmployeeDocument } from "@/lib/db/employees";
import { formatDate } from "@/lib/utils/date";
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

interface PortalUniformsProps {
  documents: EmployeeDocument[];
}

export function PortalUniforms({ documents }: PortalUniformsProps) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signMode, setSignMode] = useState<"qr" | "draw" | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [origin, setOrigin] = useState("");
  const isMobile = useIsMobile();
  const { data } = useApiQuery<EmployeeDocument[]>(
    "employee-documents",
    "/api/portal/documents",
    { type: "uniforms" },
    { fallbackData: { data: documents } }
  );
  const rows = data ?? [];

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleOpenFile = async (id?: string) => {
    if (!id) {
      toast.error("No hay archivo adjunto");
      return;
    }

    setOpeningId(id ?? null);
    const response = await fetch(`/api/employee-documents/${id}/signed-url`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      toast.error("No se pudo abrir el archivo");
      setOpeningId(null);
      return;
    }

    window.open(payload.url, "_blank", "noopener,noreferrer");
    setOpeningId(null);
  };

  const signUrl = signingId && origin ? `${origin}/portal/sign/uniforms/${signingId}` : "";

  const openSignDialog = (doc: EmployeeDocument) => {
    setSigningId(doc.id);
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
        `/api/portal/documents/${signingId}/sign`,
        { method: "POST", body: { signatureDataUrl } },
        ["employee-documents"]
      );
      toast.success("Uniforme firmado");
      closeSignDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo firmar el uniforme"
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
            <DialogTitle>Firmar uniforme</DialogTitle>
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
          <CardTitle>Uniformes</CardTitle>
          <CardDescription>Consulta y firma la entrega de uniformes.</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="space-y-3 md:hidden">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
              No hay uniformes pendientes.
            </div>
          ) : (
            rows.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                  <Badge variant={doc.signed_at ? "success" : "secondary"}>
                    {doc.signed_at ? "Firmado" : "Pendiente"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFile(doc.id)}
                    disabled={openingId === doc.id}
                  >
                    {openingId === doc.id ? "Abriendo..." : "Abrir"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openSignDialog(doc)}
                    disabled={Boolean(doc.signed_at)}
                  >
                    {doc.signed_at ? "Firmado" : "Firmar uniforme"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No hay uniformes pendientes.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <p className="font-semibold">{doc.document_name}</p>
                    </TableCell>
                    <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                    <TableCell>
                      <Badge variant={doc.signed_at ? "success" : "secondary"}>
                        {doc.signed_at ? "Firmado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFile(doc.id)}
                          disabled={openingId === doc.id}
                        >
                          {openingId === doc.id ? "Abriendo..." : "Abrir"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openSignDialog(doc)}
                          disabled={Boolean(doc.signed_at)}
                        >
                          {doc.signed_at ? "Firmado" : "Firmar"}
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
