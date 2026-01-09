"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { onboardingSchema, type OnboardingSchema } from "@/lib/schemas/onboarding";
import { createClient } from "@/lib/supabase/client";
import { apiMutation } from "@/lib/data/cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, user, loading, error } = useProfile();
  const [saving, setSaving] = useState(false);

  const form = useForm<OnboardingSchema>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      full_name: "",
      email: "",
      dni: "",
      phone: "",
      date_of_birth: ""
    }
  });

  useEffect(() => {
    if (!profile && !user) return;
    form.reset({
      full_name:
        profile?.full_name ??
        ((user?.user_metadata?.full_name as string) || ""),
      email: profile?.email ?? user?.email ?? "",
      dni: profile?.dni ?? "",
      phone: profile?.phone ?? "",
      date_of_birth: profile?.date_of_birth ?? ""
    });
  }, [form, profile, user]);

  const role = profile?.role ?? "employee";

  const intro = useMemo(
    () =>
      role === "admin"
        ? "Completa tus datos para acceder al panel de administracion."
        : "Completa tus datos para acceder a tu portal.",
    [role]
  );

  const handleSubmit = async (values: OnboardingSchema) => {
    if (!user) {
      toast.error("Sesion no valida");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        email: values.email !== user.email ? values.email : undefined,
        data: {
          full_name: values.full_name
        }
      });

      if (authError) {
        toast.error("No se pudo actualizar la cuenta");
        return;
      }

      await apiMutation(
        "/api/onboarding",
        { method: "POST", body: values },
        ["profile"]
      );

      toast.success("Datos guardados");
      router.replace(role === "admin" ? "/dashboard" : "/portal");
    } catch {
      toast.error("No se pudo completar el registro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Perfil no disponible</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      className="w-full max-w-lg"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="border-border/70 bg-card/95 shadow-soft">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-2xl">Completa tu perfil</CardTitle>
          <CardDescription>{intro}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre y apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero de telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="+54 9 11 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Guardando..." : "Guardar y continuar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
