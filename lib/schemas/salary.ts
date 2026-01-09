import { z } from "zod";

export const salarySchema = z.object({
  employee_id: z.string().uuid("Empleado invalido"),
  base_salary: z.coerce.number().min(0, "Monto requerido"),
  currency: z.string().default("USD"),
  payment_frequency: z.enum(["monthly", "biweekly", "weekly"]).default("monthly"),
  bonuses: z.coerce.number().optional().default(0),
  deductions: z.coerce.number().optional().default(0),
  bank_account: z.string().optional(),
  effective_date: z.string().min(1, "Fecha requerida"),
  end_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export type SalarySchema = z.infer<typeof salarySchema>;

export const salaryReceiptSchema = z.object({
  employee_id: z.string().uuid("Empleado invalido"),
  salary_id: z.string().uuid().optional(),
  period_start: z.string().min(1, "Periodo requerido"),
  period_end: z.string().min(1, "Periodo requerido"),
  payment_date: z.string().min(1, "Fecha requerida"),
  gross_amount: z.coerce.number().min(0, "Monto requerido"),
  net_amount: z.coerce.number().min(0, "Monto requerido"),
  bonuses: z.coerce.number().optional().default(0),
  deductions: z.coerce.number().optional().default(0),
  status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  receipt_file_url: z.string().optional(),
  signature_data_url: z.string().optional(),
  original_file_name: z.string().optional()
});

export type SalaryReceiptSchema = z.infer<typeof salaryReceiptSchema>;
