"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/",        label: "Inicio",  icon: "🏠" },
  { href: "/pedidos", label: "Pedidos", icon: "📋" },
  { href: "/perfil",  label: "Perfil",  icon: "👤" },
];

export default function NavBottom() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex items-center justify-around px-2 py-2 z-10">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              active ? "text-primary" : "text-muted"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
