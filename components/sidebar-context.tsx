"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  pinned: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: (next?: boolean) => void;
  togglePinned: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);
const STORAGE_KEY = "ems.sidebar";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { collapsed?: boolean; pinned?: boolean };
      if (typeof parsed.collapsed === "boolean") {
        setCollapsed(parsed.collapsed);
      }
      if (typeof parsed.pinned === "boolean") {
        setPinned(parsed.pinned);
      }
    } catch {
      // ignore invalid storage
    }
  }, []);

  const persist = (nextCollapsed: boolean, nextPinned: boolean) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ collapsed: nextCollapsed, pinned: nextPinned })
    );
  };

  const toggleCollapsed = (next?: boolean) => {
    setCollapsed((prev) => {
      const value = typeof next === "boolean" ? next : !prev;
      if (pinned) {
        persist(value, pinned);
      }
      return value;
    });
  };

  const togglePinned = () => {
    setPinned((prev) => {
      const next = !prev;
      persist(collapsed, next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      collapsed,
      pinned,
      mobileOpen,
      setMobileOpen,
      toggleCollapsed,
      togglePinned
    }),
    [collapsed, pinned, mobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
