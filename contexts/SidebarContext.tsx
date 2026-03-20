import React, { createContext, useContext, useMemo, useState } from "react";

interface SidebarContextValue {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isOpen,
      openSidebar: () => setIsOpen(true),
      closeSidebar: () => setIsOpen(false),
      toggleSidebar: () => setIsOpen((prev) => !prev),
    }),
    [isOpen],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useOptionalSidebar() {
  return useContext(SidebarContext);
}
