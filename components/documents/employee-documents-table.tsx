"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import { getMedicalCertificateExpiry } from "@/lib/utils/medical-certificates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type EmployeeLite = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type EmployeeDocumentLite = {
  id: string;
  employee_id?: string | null;
  document_name: string;
  file_url: string;
  uploaded_at?: string | null;
  signed_at?: string | null;
  signed_name?: string | null;
  signature_data_url?: string | null;
};

interface EmployeeDocumentsTableProps {
  title: string;
  description: string;
  documents: EmployeeDocumentLite[];
  employees: EmployeeLite[];
  emptyMessage?: string;
  variant?: "default" | "medical" | "uniform";
}

export function EmployeeDocumentsTable({
  title,
  description,
  documents,
  employees,
  emptyMessage = "No hay documentos cargados.",
  variant = "default"
}: EmployeeDocumentsTableProps) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const showSigningDetails = variant === "uniform";
  const showExpiry = variant === "medical";

  const employeeMap = useMemo(
    () =>
      employees.reduce<Record<string, string>>((acc, employee) => {
        const name = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
        acc[employee.id] = name || employee.email || "-";
        return acc;
      }, {}),
    [employees]
  );

  const getExpiryLabel = (uploadedAt?: string | null): string => {
    const expiry = getMedicalCertificateExpiry(uploadedAt);
    return expiry ? formatDate(expiry) : "-";
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

  const handleDownloadFile = async (id?: string) => {
    if (!id) {
      toast.error("No hay archivo adjunto");
      return;
    }

    setDownloadingId(id);
    window.open(`/api/employee-documents/${id}/download`, "_blank", "noopener,noreferrer");
    setDownloadingId(null);
  };

  const columnCount = 4 + (showSigningDetails ? 2 : 0) + (showExpiry ? 1 : 0);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-3 md:hidden">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            documents.map((doc) => {
              const expiryLabel = showExpiry ? getExpiryLabel(doc.uploaded_at) : null;
              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employeeMap[doc.employee_id ?? ""] ?? "-"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.uploaded_at)}
                    </span>
                  </div>
                  {showSigningDetails && (
                    <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Firmado por</span>
                        <span className="font-medium text-foreground">
                          {doc.signed_name ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fecha firma</span>
                        <span className="font-medium text-foreground">
                          {doc.signed_at ? formatDate(doc.signed_at) : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                  {showExpiry && (
                    <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Vence</span>
                        <span className="font-medium text-foreground">
                          {expiryLabel ?? "-"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 grid gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenFile(doc.id)}
                      disabled={openingId === doc.id}
                    >
                      {openingId === doc.id ? "Abriendo..." : "Ver PDF"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDownloadFile(doc.id)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? "Descargando..." : "Descargar PDF"}
                    </Button>
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
                <TableHead>Empleado</TableHead>
                <TableHead>Fecha</TableHead>
                {showSigningDetails && <TableHead>Firmado por</TableHead>}
                {showSigningDetails && <TableHead>Fecha firma</TableHead>}
                {showExpiry && <TableHead>Vence</TableHead>}
                <TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => {
                  const expiryLabel = showExpiry ? getExpiryLabel(doc.uploaded_at) : null;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <p className="font-semibold">{doc.document_name}</p>
                      </TableCell>
                      <TableCell>{employeeMap[doc.employee_id ?? ""] ?? "-"}</TableCell>
                      <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                      {showSigningDetails && (
                        <TableCell>{doc.signed_name ?? "-"}</TableCell>
                      )}
                      {showSigningDetails && (
                        <TableCell>{doc.signed_at ? formatDate(doc.signed_at) : "-"}</TableCell>
                      )}
                      {showExpiry && <TableCell>{expiryLabel ?? "-"}</TableCell>}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenFile(doc.id)}
                            disabled={openingId === doc.id}
                          >
                            {openingId === doc.id ? "Abriendo..." : "Ver PDF"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownloadFile(doc.id)}
                            disabled={downloadingId === doc.id}
                          >
                            {downloadingId === doc.id ? "Descargando..." : "Descargar"}
                          </Button>
                        </div>
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
