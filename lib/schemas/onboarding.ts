import { z } from "zod";

export const onboardingSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Minimo 2 caracteres")
    .max(120, "Maximo 120 caracteres"),
  email: z.string().email("Email invalido"),
  dni: z
    .string()
    .trim()
    .min(6, "DNI invalido")
    .max(20, "DNI invalido"),
  phone: z
    .string()
    .trim()
    .min(6, "Telefono invalido")
    .max(30, "Telefono invalido"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida")
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;
