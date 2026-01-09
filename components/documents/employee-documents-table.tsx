"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import {
  getMedicalCertificateExpiry,
  getMedicalCertificateStatus
} from "@/lib/utils/medical-certificates";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
  const showSignature = variant === "uniform";
  const showValidity = variant === "medical";

  const employeeMap = useMemo(
    () =>
      employees.reduce<Record<string, string>>((acc, employee) => {
        const name = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
        acc[employee.id] = name || employee.email || "-";
        return acc;
      }, {}),
    [employees]
  );

  const getValidityMeta = (
    uploadedAt?: string | null
  ): { expiryLabel: string; label: string; badgeVariant: BadgeProps["variant"] } => {
    const expiry = getMedicalCertificateExpiry(uploadedAt);
    const status = getMedicalCertificateStatus(uploadedAt);
    const label =
      status === "valid" ? "Vigente" : status === "expired" ? "Vencido" : "Pendiente";
    const badgeVariant =
      status === "valid" ? "success" : status === "expired" ? "destructive" : "secondary";
    return {
      expiryLabel: expiry ? formatDate(expiry) : "-",
      label,
      badgeVariant
    };
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

  const handleOpenSignature = (signatureUrl?: string | null) => {
    if (!signatureUrl) {
      toast.error("No hay firma cargada");
      return;
    }
    window.open(signatureUrl, "_blank", "noopener,noreferrer");
  };

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
              const validity = showValidity ? getValidityMeta(doc.uploaded_at) : null;
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
                  {showSignature && (
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Firma</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.signed_at ? "success" : "secondary"}>
                          {doc.signed_at ? "Firmado" : "Pendiente"}
                        </Badge>
                        {doc.signature_data_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSignature(doc.signature_data_url)}
                          >
                            Ver firma
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {showSignature && doc.signed_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doc.signed_name ?? "Empleado"} - {formatDate(doc.signed_at)}
                    </p>
                  )}
                {showValidity && validity && (
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Vigencia</span>
                      <span className="font-medium text-foreground">
                        {validity.expiryLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Estado</span>
                      <Badge variant={validity.badgeVariant}>{validity.label}</Badge>
                    </div>
                  </div>
                )}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenFile(doc.id)}
                      disabled={openingId === doc.id}
                    >
                      {openingId === doc.id ? "Abriendo..." : "Abrir archivo"}
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
                {showSignature && <TableHead>Firma</TableHead>}
                {showValidity && <TableHead>Vigencia</TableHead>}
                <TableHead>Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showSignature || showValidity ? 5 : 4}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => {
                  const validity = showValidity ? getValidityMeta(doc.uploaded_at) : null;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <p className="font-semibold">{doc.document_name}</p>
                      </TableCell>
                      <TableCell>{employeeMap[doc.employee_id ?? ""] ?? "-"}</TableCell>
                      <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                      {showSignature && (
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={doc.signed_at ? "success" : "secondary"}>
                              {doc.signed_at ? "Firmado" : "Pendiente"}
                            </Badge>
                            {doc.signed_at && (
                              <span className="text-xs text-muted-foreground">
                                {doc.signed_name ?? "Empleado"} - {formatDate(doc.signed_at)}
                              </span>
                            )}
                            {doc.signature_data_url && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-fit"
                                onClick={() => handleOpenSignature(doc.signature_data_url)}
                              >
                                Ver firma
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {showValidity && validity && (
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              {validity.expiryLabel}
                            </span>
                            <Badge variant={validity.badgeVariant}>{validity.label}</Badge>
                          </div>
                        </TableCell>
                      )}
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
