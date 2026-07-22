"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavContextType {
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
  isPending: boolean;
}

const NavContext = createContext<NavContextType>({
  pendingHref: null,
  setPendingHref: () => {},
  isPending: false,
});

export function NavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Reset pending href when location changes
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isPending = pendingHref !== null && pendingHref !== pathname;

  return (
    <NavContext.Provider value={{ pendingHref, setPendingHref, isPending }}>
      {children}
    </NavContext.Provider>
  );
}

export const useNav = () => useContext(NavContext);
