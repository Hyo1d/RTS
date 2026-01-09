"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Stethoscope,
  UserCircle,
  Users
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

const portalNavItems = [
  { href: "/portal", label: "Mi panel", icon: UserCircle },
  { href: "/portal/receipts", label: "Recibos de sueldo", icon: FileText },
  { href: "/portal/medical-certificates", label: "Certificados medicos", icon: Stethoscope },
  { href: "/portal/uniforms", label: "Uniformes", icon: Users },
  { href: "/portal/attendance", label: "Asistencia", icon: CalendarCheck }
];

interface PortalSidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  showControls?: boolean;
  variant?: "desktop" | "mobile";
}

function PortalSidebarContent({
  collapsed = false,
  onNavigate,
  showControls = true,
  variant = "desktop"
}: PortalSidebarContentProps) {
  const pathname = usePathname();
  const { toggleCollapsed } = useSidebar();

  const renderItem = (item: { href: string; label: string; icon: typeof UserCircle }) => {
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
                Portal
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
              Mi acceso
            </p>
          )}
          <div className="rounded-2xl border border-border/50 bg-background/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <nav className={cn("space-y-2", collapsed && "items-center")}>
              {portalNavItems.map((item) => renderItem(item))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortalSidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-6 hidden h-[calc(100vh-3rem)] shrink-0 lg:flex",
        collapsed ? "w-24" : "w-72",
        "transition-[width] duration-300 ease-out"
      )}
    >
      <PortalSidebarContent collapsed={collapsed} />
    </aside>
  );
}

export function PortalMobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
      <DialogContent
        className="left-0 top-0 h-full w-[86vw] max-h-none max-w-[320px] translate-x-0 translate-y-0 overflow-y-hidden rounded-none border-r border-border/60 p-4"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>
        <PortalSidebarContent
          collapsed={false}
          onNavigate={() => setMobileOpen(false)}
          showControls={false}
          variant="mobile"
        />
      </DialogContent>
    </Dialog>
  );
}
