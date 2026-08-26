"use client";

import { useCallback, useEffect, useState } from "react";
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

/**
 * Modo activo (cliente/profesional) para usuarios con ambos roles. Se
 * actualiza solo al navegar a una zona inequívoca de la app (/pro vs.
 * inicio/pedidos/professionals) y persiste en localStorage para pantallas
 * compartidas entre roles (ej. /jobs/[id]) donde no hay señal de la URL.
 */
export function useActiveRole() {
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

  return { hasClient, hasProfessional, dual, active, setActive };
}
