"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function NavBottom() {
  const pathname = usePathname();
  const { user } = useUser();
  const roles = user?.unsafeMetadata?.roles as string[] | undefined;
  const isPro = roles?.includes("professional");

  const items = isPro
    ? [
        { href: "/pro",         label: "Inicio",  icon: "🏠" },
        { href: "/pro/pedidos", label: "Pedidos", icon: "📋" },
        { href: "/perfil",      label: "Perfil",  icon: "👤" },
      ]
    : [
        { href: "/",        label: "Inicio",  icon: "🏠" },
        { href: "/pedidos", label: "Pedidos", icon: "📋" },
        { href: "/perfil",  label: "Perfil",  icon: "👤" },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex items-center justify-around px-2 py-2 z-10">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <span className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors ${active ? "bg-primary/10" : ""}`}>
              <span className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
            </span>
            <span className={`text-[11px] font-semibold transition-colors ${active ? "text-primary" : "text-muted"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
