"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const links = [
  { href: "/admin/profesionales", label: "Profesionales" },
  { href: "/admin/usuarios",      label: "Usuarios" },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-sm font-bold text-ink">Laboris</span>
          <span className="ml-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-ink hover:bg-cream"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        onClick={() => signOut({ redirectUrl: "/" })}
        className="text-sm text-muted hover:text-ink transition-colors"
      >
        Salir
      </button>
    </header>
  );
}
