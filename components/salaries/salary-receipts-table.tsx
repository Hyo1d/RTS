"use client";

import { useState } from "react";
import type { Employee } from "@/lib/db/employees";
import type { SalaryReceipt } from "@/lib/db/salaries";
import { useSalaryReceipts } from "@/hooks/useSalaryReceipts";
import { formatDate, formatDateRange } from "@/lib/utils/date";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface SalaryReceiptsTableProps {
  employees: Employee[];
}

export function SalaryReceiptsTable({ employees }: SalaryReceiptsTableProps) {
  const { data, loading } = useSalaryReceipts();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const employeeMap = employees.reduce<Record<string, string>>((acc, employee) => {
    acc[employee.id] = `${employee.first_name} ${employee.last_name}`;
    return acc;
  }, {});

  const handleOpenPdf = async (receipt?: SalaryReceipt) => {
    if (!receipt?.id || !receipt.receipt_file_url) {
      toast.error("No hay PDF adjunto");
      return;
    }

    if (receipt.signature_data_url) {
      window.open(
        `/api/salary-receipts/${receipt.id}/signed`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    setOpeningId(receipt.id);
    const response = await fetch(`/api/salary-receipts/${receipt.id}/signed-url`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      toast.error("No se pudo abrir el PDF");
      setOpeningId(null);
      return;
    }

    window.open(payload.url, "_blank", "noopener,noreferrer");
    setOpeningId(null);
  };

  const handleDownloadPdf = async (receipt?: SalaryReceipt) => {
    if (!receipt?.id || !receipt.receipt_file_url) {
      toast.error("No hay PDF adjunto");
      return;
    }

    setDownloadingId(receipt.id);
    if (receipt.signature_data_url) {
      window.open(
        `/api/salary-receipts/${receipt.id}/signed?download=1`,
        "_blank",
        "noopener,noreferrer"
      );
      setDownloadingId(null);
      return;
    }

    window.open(`/api/salary-receipts/${receipt.id}/download`, "_blank", "noopener,noreferrer");
    setDownloadingId(null);
  };

  return (
    <Card className="flex flex-1 flex-col md:min-h-[440px]">
      <CardContent className="flex-1 p-6">
        <div className="space-y-3 md:hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : data.length === 0
              ? (
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    No hay recibos registrados.
                  </div>
                )
              : data.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {employeeMap[receipt.employee_id ?? ""] ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateRange(receipt.period_start, receipt.period_end)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(receipt.payment_date)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Pago</span>
                        <span className="font-medium text-foreground">
                          {formatDate(receipt.payment_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Firmado por</span>
                        <span className="font-medium text-foreground">
                          {receipt.signed_name ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fecha firma</span>
                        <span className="font-medium text-foreground">
                          {receipt.signed_at ? formatDate(receipt.signed_at) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Bruto / Neto</span>
                        <span className="font-medium text-foreground">
                          {receipt.gross_amount} / {receipt.net_amount}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenPdf(receipt)}
                        disabled={!receipt.receipt_file_url || openingId === receipt.id}
                      >
                        {openingId === receipt.id ? "Abriendo..." : "Ver PDF"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownloadPdf(receipt)}
                        disabled={!receipt.receipt_file_url || downloadingId === receipt.id}
                      >
                        {downloadingId === receipt.id ? "Descargando..." : "Descargar PDF"}
                      </Button>
                    </div>
                  </div>
                ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Bruto</TableHead>
                <TableHead>Neto</TableHead>
                <TableHead>Firmado por</TableHead>
                <TableHead>Fecha firma</TableHead>
                <TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No hay recibos registrados.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>{employeeMap[receipt.employee_id ?? ""] ?? "-"}</TableCell>
                    <TableCell>
                      {formatDateRange(receipt.period_start, receipt.period_end)}
                    </TableCell>
                    <TableCell>{formatDate(receipt.payment_date)}</TableCell>
                    <TableCell>{receipt.gross_amount}</TableCell>
                    <TableCell>{receipt.net_amount}</TableCell>
                    <TableCell>{receipt.signed_name ?? "-"}</TableCell>
                    <TableCell>{receipt.signed_at ? formatDate(receipt.signed_at) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPdf(receipt)}
                          disabled={!receipt.receipt_file_url || openingId === receipt.id}
                        >
                          {openingId === receipt.id ? "Abriendo..." : "Ver PDF"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadPdf(receipt)}
                          disabled={!receipt.receipt_file_url || downloadingId === receipt.id}
                        >
                          {downloadingId === receipt.id ? "Descargando..." : "Descargar"}
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
