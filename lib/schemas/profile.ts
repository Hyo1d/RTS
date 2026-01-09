import { z } from "zod";

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Minimo 2 caracteres")
    .max(120, "Maximo 120 caracteres")
    .or(z.literal("")),
  email: z.string().email("Email invalido"),
  dni: z
    .string()
    .trim()
    .min(6, "DNI invalido")
    .max(20, "DNI invalido")
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(6, "Telefono invalido")
    .max(30, "Telefono invalido")
    .or(z.literal("")),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida")
    .or(z.literal(""))
});

export type ProfileSchema = z.infer<typeof profileSchema>;
