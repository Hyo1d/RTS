"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Employee } from "@/lib/db/employees";
import { salaryReceiptSchema, type SalaryReceiptSchema } from "@/lib/schemas/salary";
import { uploadSalaryReceipt } from "@/lib/storage/upload";
import { apiMutation } from "@/lib/data/cache";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReceiptFormProps {
  employees: Employee[];
}

export function ReceiptForm({ employees }: ReceiptFormProps) {
  const [open, setOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const form = useForm<SalaryReceiptSchema>({
    resolver: zodResolver(salaryReceiptSchema),
    defaultValues: {
      employee_id: "",
      period_start: "",
      period_end: "",
      payment_date: "",
      gross_amount: 0,
      net_amount: 0,
      bonuses: 0,
      deductions: 0,
      status: "pending"
    }
  });

  const handleSubmit = async (values: SalaryReceiptSchema) => {
    try {
      let filePath: string | undefined;
      if (receiptFile) {
        const { path } = await uploadSalaryReceipt(receiptFile, values.employee_id);
        filePath = path;
      }

      await apiMutation(
        "/api/salary-receipts",
        {
          method: "POST",
          body: {
            ...values,
            receipt_file_url: filePath,
            original_file_name: receiptFile?.name
          }
        },
        ["salary-receipts"]
      );

      toast.success("Recibo registrado");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el recibo"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">Nuevo recibo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar recibo</DialogTitle>
          <DialogDescription>Sube el PDF y registra el pago.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio periodo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin periodo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gross_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bruto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="net_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Recibo PDF</Label>
              <Input type="file" accept="application/pdf" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" className="w-full">Guardar recibo</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
