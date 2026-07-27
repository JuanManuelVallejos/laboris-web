"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Button from "@/components/ui/Button";

const links = [
  { href: "/admin/profesionales", label: "Profesionales" },
  { href: "/admin/usuarios",      label: "Usuarios" },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <header className="topbar">
      <div className="topbar__in">
        <div className="flex items-center gap-2">
          <span className="wordmark" style={{ fontSize: "1.25rem" }}>
            Labor<em>is</em>
          </span>
          <span className="badge badge--info">Admin</span>
        </div>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? "bg-brand-light text-brand-mid"
                  : "text-ink-mid hover:text-ink hover:bg-surface-3"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="topbar__spacer" />

        <Button variant="ghost" size="sm" onClick={() => signOut({ redirectUrl: "/" })}>
          Salir
        </Button>
      </div>
    </header>
  );
}
