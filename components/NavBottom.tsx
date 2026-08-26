"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Icon from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/sprite";
import { activeHref } from "@/lib/nav";

export default function NavBottom() {
  const pathname = usePathname();
  const { user } = useUser();
  const roles = user?.unsafeMetadata?.roles as string[] | undefined;
  const isPro = roles?.includes("professional");

  const items: { href: string; label: string; icon: IconName }[] = isPro
    ? [
        { href: "/pro",         label: "Inicio",  icon: "home" },
        { href: "/pro/pedidos", label: "Pedidos", icon: "clip" },
        { href: "/perfil",      label: "Perfil",  icon: "user" },
      ]
    : [
        { href: "/",        label: "Inicio",  icon: "home" },
        { href: "/pedidos", label: "Pedidos", icon: "clip" },
        { href: "/perfil",  label: "Perfil",  icon: "user" },
      ];

  const active = activeHref(pathname, items.map((i) => i.href));

  return (
    <nav className="bnav md:hidden fixed bottom-0 left-0 right-0 z-10">
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link key={item.href} href={item.href} className={`bn ${isActive ? "bn--active" : ""}`}>
            <Icon name={item.icon} className="ico" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
