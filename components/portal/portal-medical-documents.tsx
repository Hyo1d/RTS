"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { EmployeeDocument } from "@/lib/db/employees";
import { uploadEmployeeDocument } from "@/lib/storage/upload";
import { formatDate } from "@/lib/utils/date";
import {
  getMedicalCertificateExpiry,
  getMedicalCertificateStatus
} from "@/lib/utils/medical-certificates";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface PortalMedicalDocumentsProps {
  documents: EmployeeDocument[];
  employeeId: string;
}

export function PortalMedicalDocuments({
  documents,
  employeeId
}: PortalMedicalDocumentsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const { data } = useApiQuery<EmployeeDocument[]>(
    "employee-documents",
    "/api/portal/documents",
    { type: "medical" },
    { fallbackData: { data: documents } }
  );
  const rows = data ?? [];
  const latestCertificate = rows[0];
  const latestStatus = getMedicalCertificateStatus(latestCertificate?.uploaded_at);
  const latestExpiry = getMedicalCertificateExpiry(latestCertificate?.uploaded_at);
  const statusLabel =
    latestStatus === "valid" ? "Vigente" : latestStatus === "expired" ? "Vencido" : "Pendiente";
  const statusVariant =
    latestStatus === "valid" ? "success" : latestStatus === "expired" ? "destructive" : "secondary";
  const expiryLabel = latestExpiry ? formatDate(latestExpiry) : "-";
  const statusCopy =
    latestStatus === "valid"
      ? `Vigente hasta ${expiryLabel}.`
      : latestStatus === "expired"
        ? `Certificado vencido desde ${expiryLabel}.`
        : "Subi tu certificado anual para mantenerlo vigente.";

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }

    setUploading(true);
    try {
      const { path } = await uploadEmployeeDocument(
        file,
        employeeId,
        "certificado_medico"
      );
      await apiMutation(
        "/api/portal/documents",
        {
          method: "POST",
          body: {
            document_type: "certificado_medico",
            document_name: documentName.trim() || file.name,
            file_url: path,
            file_size: file.size
          }
        },
        ["employee-documents"]
      );
      setFile(null);
      setDocumentName("");
      toast.success("Certificado cargado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir el certificado"
      );
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Certificados medicos</CardTitle>
          <CardDescription>
            Carga y consulta tus certificados medicos.
          </CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Input
            placeholder="Nombre del documento"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
          />
          <Input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">Estado anual</span>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{statusCopy}</p>
        </div>

        <div className="space-y-3 md:hidden">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
              No hay certificados cargados.
            </div>
          ) : (
            rows.map((doc) => {
              const docExpiry = getMedicalCertificateExpiry(doc.uploaded_at);
              const docStatus = getMedicalCertificateStatus(doc.uploaded_at);
              const docLabel =
                docStatus === "valid"
                  ? "Vigente"
                  : docStatus === "expired"
                    ? "Vencido"
                    : "Pendiente";
              const docVariant =
                docStatus === "valid"
                  ? "success"
                  : docStatus === "expired"
                    ? "destructive"
                    : "secondary";
              return (
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
                    <Badge variant={docVariant}>{docLabel}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenFile(doc.id)}
                      disabled={openingId === doc.id}
                    >
                      {openingId === doc.id ? "Abriendo..." : "Abrir"}
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Vigencia</span>
                    <span className="font-medium text-foreground">
                      {docExpiry ? formatDate(docExpiry) : "-"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No hay certificados cargados.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((doc) => {
                  const docExpiry = getMedicalCertificateExpiry(doc.uploaded_at);
                  const docStatus = getMedicalCertificateStatus(doc.uploaded_at);
                  const docLabel =
                    docStatus === "valid"
                      ? "Vigente"
                      : docStatus === "expired"
                        ? "Vencido"
                        : "Pendiente";
                  const docVariant =
                    docStatus === "valid"
                      ? "success"
                      : docStatus === "expired"
                        ? "destructive"
                        : "secondary";
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <p className="font-semibold">{doc.document_name}</p>
                      </TableCell>
                      <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {docExpiry ? formatDate(docExpiry) : "-"}
                          </span>
                          <Badge variant={docVariant}>{docLabel}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFile(doc.id)}
                          disabled={openingId === doc.id}
                        >
                          {openingId === doc.id ? "Abriendo..." : "Abrir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
