import { ReactNode } from "react";
import { PortalSidebar, PortalMobileSidebar } from "@/components/portal-sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import { Topbar } from "@/components/topbar";

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  return (
    <SidebarProvider>
      <PortalMobileSidebar />
      <div className="flex min-h-screen w-full flex-col gap-4 px-3 py-3 sm:gap-6 sm:px-4 sm:py-4 lg:flex-row lg:items-stretch lg:gap-6 lg:px-8 lg:py-6">
        <PortalSidebar />
        <main className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
          <Topbar />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
