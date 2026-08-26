"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export type Role = "client" | "professional";

const STORAGE_KEY = "lab-active-role";

function isProfessionalPath(pathname: string): boolean {
  return pathname === "/pro" || pathname.startsWith("/pro/");
}

function isClientPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/pedidos") ||
    pathname.startsWith("/professionals") ||
    pathname.startsWith("/request-sent")
  );
}

interface ActiveRoleValue {
  hasClient: boolean;
  hasProfessional: boolean;
  dual: boolean;
  active: Role;
  setActive: (role: Role) => void;
}

const DEFAULT_VALUE: ActiveRoleValue = {
  hasClient: false,
  hasProfessional: false,
  dual: false,
  active: "client",
  setActive: () => {},
};

const ActiveRoleContext = createContext<ActiveRoleValue | null>(null);

/**
 * Fuente única del modo activo (cliente/profesional), montada una vez en
 * app/layout.tsx. Antes cada componente (Topbar, NavBottom, la página de un
 * job, etc.) tenía su propia copia vía useState + localStorage, así que un
 * cambio hecho en un lugar (ej. al abrir un job) no se reflejaba en los
 * demás (ej. la pill del Topbar) hasta el próximo montaje. Con Context,
 * todos comparten el mismo estado de React y se actualizan juntos.
 */
export function ActiveRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();
  const roles = (user?.unsafeMetadata?.roles as string[] | undefined) ?? [];
  const hasClient = roles.includes("client");
  const hasProfessional = roles.includes("professional");
  const dual = hasClient && hasProfessional;

  const [stored, setStored] = useState<Role>("client");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "client" || saved === "professional") setStored(saved);
  }, []);

  useEffect(() => {
    if (!dual) return;
    if (isProfessionalPath(pathname)) {
      setStored("professional");
      localStorage.setItem(STORAGE_KEY, "professional");
    } else if (isClientPath(pathname)) {
      setStored("client");
      localStorage.setItem(STORAGE_KEY, "client");
    }
  }, [pathname, dual]);

  const setActive = useCallback((role: Role) => {
    setStored(role);
    localStorage.setItem(STORAGE_KEY, role);
  }, []);

  const active: Role = dual ? stored : hasProfessional ? "professional" : "client";

  const value: ActiveRoleValue = { hasClient, hasProfessional, dual, active, setActive };
  return <ActiveRoleContext.Provider value={value}>{children}</ActiveRoleContext.Provider>;
}

export function useActiveRole(): ActiveRoleValue {
  return useContext(ActiveRoleContext) ?? DEFAULT_VALUE;
}
