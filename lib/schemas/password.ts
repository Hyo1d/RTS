import { z } from "zod";

export const passwordSchema = z
  .object({
    password: z.string().min(6, "Minimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Minimo 6 caracteres")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  });

export type PasswordSchema = z.infer<typeof passwordSchema>;
