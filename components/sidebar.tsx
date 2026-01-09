"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ChevronDown,
  Database,
  FileText,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UserCog,
  Users,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/sidebar-context";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/employees", label: "Empleados", icon: Users },
  { href: "/attendance", label: "Asistencias", icon: CalendarCheck },
  { href: "/salaries", label: "Sueldos", icon: Wallet }
];

const documentsNavItems = [
  { href: "/documents/medical", label: "Certificados medicos" },
  { href: "/documents/uniforms", label: "Uniformes" },
  { href: "/documents/receipts", label: "Recibos de sueldo" }
];

const systemNavItems = [
  { href: "/database", label: "Base de datos", icon: Database },
  { href: "/app-users", label: "Usuarios app", icon: UserCog },
  { href: "/settings", label: "Configuracion", icon: Settings }
];

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  showControls?: boolean;
  variant?: "desktop" | "mobile";
}

function SidebarContent({
  collapsed = false,
  onNavigate,
  showControls = true,
  variant = "desktop"
}: SidebarContentProps) {
  const pathname = usePathname();
  const { toggleCollapsed } = useSidebar();
  const [documentsOpen, setDocumentsOpen] = useState(() => pathname.startsWith("/documents"));
  const documentsActive = pathname.startsWith("/documents");

  useEffect(() => {
    if (pathname.startsWith("/documents")) {
      setDocumentsOpen(true);
    }
  }, [pathname]);

  const renderItem = (item: { href: string; label: string; icon: typeof LayoutGrid }) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          collapsed && "justify-center px-0",
          active
            ? cn(
                "bg-accent/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                collapsed ? "border border-border/60" : "border-l-[3px] border-accent"
              )
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}
      >
        <Icon className="h-4 w-4" />
        {!collapsed && item.label}
      </Link>
    );
  };

  const renderSubItem = (item: { href: string; label: string }) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          active
            ? "bg-accent/10 text-foreground"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current/70" aria-hidden />
        {item.label}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-y-auto border border-border/60 bg-card/80 shadow-soft backdrop-blur",
        variant === "mobile" ? "gap-4 p-3" : "gap-5 p-4",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        variant === "desktop" ? "rounded-3xl" : "rounded-none border-none shadow-none"
      )}
      data-collapsed={collapsed}
    >
      <div className={cn("flex items-start justify-between gap-3", collapsed && "flex-col")}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <div
            className={cn(
              "rounded-2xl border border-border/60 bg-accent/10 p-2 shadow-soft",
              collapsed && "p-1.5"
            )}
          >
            <Shield className={cn("text-accent", collapsed ? "h-7 w-7" : "h-8 w-8")} aria-hidden />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">Random TecnoSecurity</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Manager
              </p>
            </div>
          )}
        </div>
        {showControls && (
          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => toggleCollapsed()}
              aria-label={collapsed ? "Expandir sidebar" : "Contraer sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-3">
          {!collapsed && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Principal
            </p>
          )}
          <div className="rounded-2xl border border-border/50 bg-background/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <nav className={cn("space-y-2", collapsed && "items-center")}>
              {mainNavItems.map((item) => renderItem(item))}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setDocumentsOpen((prev) => !prev)}
                  title={collapsed ? "Documentos" : undefined}
                  aria-expanded={documentsOpen}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                    collapsed && "justify-center px-0",
                    documentsActive
                      ? cn(
                          "bg-accent/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                          collapsed
                            ? "border border-border/60"
                            : "border-l-[3px] border-accent"
                        )
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  {!collapsed && <span className="flex-1 text-left">Documentos</span>}
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        documentsOpen && "rotate-180"
                      )}
                    />
                  )}
                </button>
                {!collapsed && documentsOpen && (
                  <div className="space-y-1 pl-6">
                    {documentsNavItems.map((item) => renderSubItem(item))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>

        <div className="h-px bg-border/60" />

        <div className="space-y-3">
          {!collapsed && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Sistema
            </p>
          )}
          <div className="rounded-2xl border border-border/50 bg-background/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <nav className={cn("space-y-2", collapsed && "items-center")}>
              {systemNavItems.map((item) => renderItem(item))}
            </nav>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-auto rounded-2xl border border-border/60 bg-muted/50 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="font-semibold">Tiempo real activo</p>
          <p className="text-muted-foreground">
            Supabase Realtime mantiene tu panel sincronizado.
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-6 hidden h-[calc(100vh-3rem)] shrink-0 lg:flex",
        collapsed ? "w-24" : "w-72",
        "transition-[width] duration-300 ease-out"
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
      <DialogContent
        className="left-0 top-0 h-full w-[86vw] max-h-none max-w-[320px] translate-x-0 translate-y-0 overflow-y-hidden rounded-none border-r border-border/60 p-4"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>
        <SidebarContent
          collapsed={false}
          onNavigate={() => setMobileOpen(false)}
          showControls={false}
          variant="mobile"
        />
      </DialogContent>
    </Dialog>
  );
}
