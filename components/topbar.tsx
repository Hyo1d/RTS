"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSidebar } from "@/components/sidebar-context";

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Empleados",
  attendance: "Asistencias",
  database: "Base de datos",
  documents: "Documentos",
  medical: "Certificados medicos",
  "medical-certificates": "Certificados medicos",
  portal: "Mi panel",
  uniforms: "Uniformes",
  salaries: "Sueldos",
  receipts: "Recibos de sueldo",
  new: "Nuevo",
  edit: "Editar",
  "app-users": "Usuarios app",
  settings: "Configuracion"
};

function formatBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: breadcrumbLabels[segment] ?? segment
  }));
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = formatBreadcrumb(pathname);
  const { setMobileOpen } = useSidebar();
  const { profile, user } = useProfile();

  const displayName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";
  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    undefined;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-card/80 px-3 py-3 shadow-soft supports-[backdrop-filter]:bg-card/60 supports-[backdrop-filter]:backdrop-blur sm:gap-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <nav className="hidden flex-wrap items-center gap-2 text-xs text-muted-foreground sm:flex">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-2">
                <Link href={crumb.href} className="transition hover:text-foreground">
                  {crumb.label}
                </Link>
                {index < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
          <h1 className="truncate font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
            {breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-1.5"
                aria-label="Abrir menu de usuario"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>
                    {initials || <UserCircle className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Configuracion</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Cerrar sesion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <div className="relative order-2 flex-1 sm:order-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empleados, empresas..."
            className="h-9 pl-9 sm:h-10"
          />
        </div>
        <div className="order-1 hidden items-center justify-between gap-2 sm:order-2 sm:flex sm:justify-end">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-2.5 md:px-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>
                    {initials || <UserCircle className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Configuracion</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Cerrar sesion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
