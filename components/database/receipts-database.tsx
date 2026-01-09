"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/lib/db/employees";
import type { SalaryReceipt } from "@/lib/db/salaries";
import { downloadCsv } from "@/lib/utils/csv";
import { formatDate, formatDateRange } from "@/lib/utils/date";
import { toast } from "sonner";
import { apiFetch, buildApiUrl, useApiQuery } from "@/lib/data/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ReceiptsDatabaseProps {
  employees: Pick<Employee, "id" | "first_name" | "last_name">[];
}

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "cancelled", label: "Cancelado" }
];

export function ReceiptsDatabase({ employees }: ReceiptsDatabaseProps) {
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const pageSize = 15;

  const employeeMap = useMemo(
    () =>
      employees.reduce<Record<string, string>>((acc, employee) => {
        acc[employee.id] = `${employee.first_name} ${employee.last_name}`.trim();
        return acc;
      }, {}),
    [employees]
  );

  const { data, count, isLoading } = useApiQuery<SalaryReceipt[]>(
    "salary-receipts",
    "/api/salary-receipts",
    {
      employeeId,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize
    }
  );
  const rows = data ?? [];
  const loading = isLoading;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const handleExport = async () => {
    const url = buildApiUrl("/api/salary-receipts", {
      employeeId,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
      pageSize: 200
    });
    const result = await apiFetch<{ data?: SalaryReceipt[] }>(url);
    const rows = result.data ?? [];

    downloadCsv(
      rows.map((row: SalaryReceipt) => ({
        ...row,
        employee_name: employeeMap[row.employee_id ?? ""] ?? "-"
      })),
      [
        { key: "employee_name", label: "Empleado" },
        { key: "period_start", label: "Periodo inicio" },
        { key: "period_end", label: "Periodo fin" },
        { key: "payment_date", label: "Pago" },
        { key: "gross_amount", label: "Bruto" },
        { key: "net_amount", label: "Neto" },
        { key: "status", label: "Estado" }
      ],
      "recibos.csv"
    );
  };

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

  const handleOpenSignature = (signatureUrl?: string | null) => {
    if (!signatureUrl) {
      toast.error("No hay firma cargada");
      return;
    }
    window.open(signatureUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="flex flex-1 flex-col md:min-h-[560px]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Recibos</CardTitle>
          <CardDescription>{count} registros</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="w-full md:w-auto"
        >
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr]">
          <Select
            value={employeeId ?? "all"}
            onValueChange={(value) => {
              setEmployeeId(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Empleado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status ?? "all"}
            onValueChange={(value) => {
              setStatus(value === "all" ? undefined : value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
          />
        </div>

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
            : rows.length === 0
              ? (
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                    No hay recibos con esos filtros.
                  </div>
                )
              : rows.map((receipt) => (
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
                      <Badge
                        variant={
                          receipt.status === "paid"
                            ? "success"
                            : receipt.status === "pending"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {receipt.status ?? "unknown"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Pago</span>
                        <span className="font-medium text-foreground">
                          {formatDate(receipt.payment_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Firma</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={receipt.signed_at ? "success" : "secondary"}>
                            {receipt.signed_at ? "Firmado" : "Pendiente"}
                          </Badge>
                          {receipt.signature_data_url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSignature(receipt.signature_data_url)}
                            >
                              Ver firma
                            </Button>
                          )}
                        </div>
                      </div>
                      {receipt.signed_at && (
                        <div className="flex items-center justify-between">
                          <span>Firmado por</span>
                          <span className="font-medium text-foreground">
                            {receipt.signed_name ?? "Empleado"} -{" "}
                            {formatDate(receipt.signed_at)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Bruto / Neto</span>
                        <span className="font-medium text-foreground">
                          {receipt.gross_amount} / {receipt.net_amount}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleOpenPdf(receipt.id)}
                      disabled={!receipt.receipt_file_url || openingId === receipt.id}
                    >
                      {openingId === receipt.id ? "Abriendo..." : "Ver PDF"}
                    </Button>
                  </div>
                ))}
        </div>

        <div className="hidden flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[1020px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Bruto</TableHead>
                <TableHead>Neto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No hay recibos con esos filtros.
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : rows.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{employeeMap[receipt.employee_id ?? ""] ?? "-"}</TableCell>
                        <TableCell>
                          {formatDateRange(receipt.period_start, receipt.period_end)}
                        </TableCell>
                        <TableCell>{formatDate(receipt.payment_date)}</TableCell>
                        <TableCell>{receipt.gross_amount}</TableCell>
                        <TableCell>{receipt.net_amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              receipt.status === "paid"
                                ? "success"
                                : receipt.status === "pending"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {receipt.status ?? "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={receipt.signed_at ? "success" : "secondary"}>
                              {receipt.signed_at ? "Firmado" : "Pendiente"}
                            </Badge>
                            {receipt.signed_at && (
                              <span className="text-xs text-muted-foreground">
                                {receipt.signed_name ?? "Empleado"} -{" "}
                                {formatDate(receipt.signed_at)}
                              </span>
                            )}
                            {receipt.signature_data_url && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-fit"
                                onClick={() => handleOpenSignature(receipt.signature_data_url)}
                              >
                                Ver firma
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPdf(receipt.id)}
                            disabled={!receipt.receipt_file_url || openingId === receipt.id}
                          >
                            {openingId === receipt.id ? "Abriendo..." : "Ver PDF"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Mostrando {rows.length} de {count} registros
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Siguiente
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
