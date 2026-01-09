"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { profileSchema, type ProfileSchema } from "@/lib/schemas/profile";
import { passwordSchema, type PasswordSchema } from "@/lib/schemas/password";
import { createClient } from "@/lib/supabase/client";
import { uploadProfileImage } from "@/lib/storage/upload";
import { invalidateTag } from "@/lib/data/cache";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProfileSettings() {
  const { profile, user, loading, error } = useProfile();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const profileForm = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      email: "",
      dni: "",
      phone: "",
      date_of_birth: ""
    }
  });

  const passwordForm = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    if (!profile && !user) {
      return;
    }

    profileForm.reset({
      full_name: profile?.full_name ?? "",
      email: profile?.email ?? user?.email ?? "",
      dni: profile?.dni ?? "",
      phone: profile?.phone ?? "",
      date_of_birth: profile?.date_of_birth ?? ""
    });
  }, [profile, user, profileForm]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [avatarFile]);

  const initials = useMemo(() => {
    const base = profile?.full_name || user?.email || "Usuario";
    return base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [profile, user]);

  const handleProfileSubmit = async (values: ProfileSchema) => {
    if (!user) {
      toast.error("Sesion no valida");
      return;
    }

    const supabase = createClient();
    let avatarUrl = profile?.avatar_url ?? null;

    try {
      if (avatarFile) {
        const { publicUrl } = await uploadProfileImage(avatarFile, user.id);
        avatarUrl = publicUrl;
      }

      const fullName = values.full_name.trim() || null;
      const dni = values.dni.trim() || null;
      const phone = values.phone.trim() || null;
      const dateOfBirth = values.date_of_birth.trim() || null;
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: values.email,
          full_name: fullName,
          dni,
          phone,
          date_of_birth: dateOfBirth,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

      if (profileError) {
        toast.error("No se pudo actualizar el perfil");
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: values.email !== user.email ? values.email : undefined,
        data: {
          full_name: fullName ?? "",
          avatar_url: avatarUrl ?? ""
        }
      });

      if (authError) {
        toast.error("No se pudo actualizar la cuenta");
        return;
      }

      toast.success("Perfil actualizado");
      setAvatarFile(null);
      await invalidateTag("profile");
    } catch (submitError) {
      toast.error("Error al guardar cambios");
    }
  };

  const handlePasswordSubmit = async (values: PasswordSchema) => {
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password
    });

    if (updateError) {
      toast.error("No se pudo actualizar la contraseña");
      return;
    }

    toast.success("Contraseña actualizada");
    passwordForm.reset();
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Perfil no disponible</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold sm:text-2xl">Perfil y seguridad</h2>
        <p className="text-sm text-muted-foreground">
          Actualiza tus datos personales y credenciales de acceso.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informacion personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-14 w-14 border border-border/60 bg-muted/40 sm:h-16 sm:w-16">
                  <AvatarImage
                    src={avatarPreview ?? profile?.avatar_url ?? undefined}
                    alt={profile?.full_name ?? "Avatar"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                    <Label>Foto de perfil</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent/25"
                      onChange={(event) =>
                        setAvatarFile(event.target.files?.[0] ?? null)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado 400x400px, maximo 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <Form {...profileForm}>
                <form
                  className="space-y-4"
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
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
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
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
                    <FormField
                      control={profileForm.control}
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
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <Input value={profile?.role ?? "employee"} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>ID de usuario</Label>
                      <Input value={user?.id ?? ""} disabled />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Si cambias el email, Supabase enviara un correo de verificacion.
                  </p>

                    <div className="flex justify-end">
                      <Button type="submit" className="w-full sm:w-auto">
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  className="space-y-4"
                  onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                    <div className="flex justify-end">
                      <Button type="submit" className="w-full sm:w-auto">
                        Actualizar contraseña
                      </Button>
                    </div>
                  </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
