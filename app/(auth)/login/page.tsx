"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Chrome, Shield } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginSchema, type LoginSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const buildRedirectUrl = () => {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    return callbackUrl.toString();
  };

  const handleSubmit = async (values: LoginSchema) => {
    setLoading(true);
    const timeoutId = window.setTimeout(() => {
      setLoading(false);
      toast.error("Tiempo de espera agotado", {
        description: "Revisa tu conexion y vuelve a intentar."
      });
    }, 12000);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        toast.error("Credenciales invalidas", {
          description: error.message
        });
        return;
      }

      if (!data.session) {
        toast.error("No se pudo iniciar sesion", {
          description: "Verifica si tu email esta confirmado."
        });
        return;
      }

      toast.success("Bienvenido de vuelta");
      const redirectTo =
        new URLSearchParams(window.location.search).get("redirectedFrom") ||
        "/dashboard";
      window.location.assign(redirectTo);
    } catch (error) {
      toast.error("No se pudo iniciar sesion");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildRedirectUrl()
        }
      });

      if (error) {
        toast.error("No se pudo iniciar sesion", {
          description: error.message
        });
        setOauthLoading(false);
      }
    } catch (error) {
      toast.error("No se pudo iniciar sesion");
      setOauthLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden border-border/70 bg-card/95 shadow-soft">
        <div className="absolute -right-16 top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
        <CardHeader className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border/60 bg-accent/10 p-2 shadow-soft">
              <Shield className="h-9 w-9 text-accent" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Random TecnoSecurity</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Manager
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl">Iniciar sesion</CardTitle>
            <CardDescription>Accede a Manager con tu cuenta corporativa.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-6">
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full border border-accent/40 bg-accent/10 text-foreground hover:bg-accent/20"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading}
            >
              <Chrome className="h-4 w-4 text-accent" />
              {oauthLoading ? "Conectando..." : "Continuar con Google"}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" />
            <span>o</span>
            <Separator className="flex-1" />
          </div>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email corporativo</FormLabel>
                    <FormControl>
                      <Input placeholder="you@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrasena</FormLabel>
                    <FormControl>
                      <Input placeholder="********" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Accediendo..." : "Entrar"}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-muted-foreground">
            Problemas para ingresar? Verifica que tu email este confirmado o contacta al admin.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
