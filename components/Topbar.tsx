"use client";

import Link from "next/link";
import { Show, UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/icons/Icon";
import Button from "@/components/ui/Button";
import { useTheme } from "@/lib/useTheme";
import { useActiveRole } from "@/lib/useActiveRole";
import { useEventStream } from "@/lib/useEventStream";
import { activeHref } from "@/lib/nav";
import {
  getUnreadCount,
  getNotifications,
  markAllNotificationsRead,
  notificationsStreamUrl,
  type Notification,
} from "@/lib/api";

const NAV_LINKS_PRO = [
  { href: "/pro",         label: "Inicio" },
  { href: "/pro/pedidos", label: "Actividad" },
  { href: "/perfil",      label: "Perfil" },
];

const NAV_LINKS_CLIENT = [
  { href: "/",        label: "Inicio" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/perfil",  label: "Perfil" },
];

function notifHref(n: Notification): string {
  if (n.type === "new_request") return "/pro/pedidos";
  if (n.entityId) return `/jobs/${n.entityId}`;
  if (n.type === "request_accepted" || n.type === "request_rejected") return "/pedidos";
  return "/";
}

function ModeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" className="mode-toggle" onClick={toggle} aria-label="Cambiar tema">
      <span className={`seg ${theme === "light" ? "on" : ""}`}>
        <Icon name="sun" className="ico" />
      </span>
      <span className={`seg ${theme === "dark" ? "on" : ""}`}>
        <Icon name="moon" className="ico" />
      </span>
    </button>
  );
}

function NotificationBell() {
  const { isSignedIn, getToken } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    getUnreadCount(getToken).then(setUnread).catch(() => {});
  }, [isSignedIn, getToken]);

  useEventStream<Notification>(
    isSignedIn ? notificationsStreamUrl() : null,
    getToken,
    () => {
      setUnread((c) => c + 1);
    },
    { pauseWhenHidden: true }
  );

  // Fallback de baja frecuencia por si el stream queda trabado — ya no es el
  // mecanismo principal, solo una red de seguridad.
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(() => {
      getUnreadCount(getToken).then(setUnread).catch(() => {});
    }, 120_000);
    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open) {
      const [notifs] = await Promise.all([
        getNotifications(getToken),
        unread > 0 ? markAllNotificationsRead(getToken) : Promise.resolve(),
      ]);
      setNotifications(notifs);
      setUnread(0);
    }
  };

  if (!isSignedIn) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-surface-3 text-ink-mid hover:bg-border transition-colors"
        aria-label="Notificaciones"
      >
        <Icon name="bell" className="ico" style={{ width: 17, height: 17 }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-alert text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(320px,calc(100vw-2rem))] bg-surface-2 rounded-2xl shadow-lg border border-border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-ink">Notificaciones</p>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink-soft">
              No tenés notificaciones
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={notifHref(n)}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-surface-3 transition-colors"
                  >
                    <p className="text-sm text-ink">{n.message}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {new Date(n.createdAt).toLocaleString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RolePill() {
  const { active } = useActiveRole();
  const seg = (isActive: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      isActive ? "bg-brand-light text-brand-mid" : "text-ink-mid hover:text-ink"
    }`;
  return (
    <div className="flex items-center gap-0.5 border border-border bg-surface-2 rounded-full p-1" role="group" aria-label="Modo">
      <Link href="/" className={seg(active === "client")}>
        Cliente
      </Link>
      <Link href="/pro" className={seg(active === "professional")}>
        Profesional
      </Link>
    </div>
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const { active, dual } = useActiveRole();
  const navLinks = active === "professional" ? NAV_LINKS_PRO : NAV_LINKS_CLIENT;
  const activeHrefValue = activeHref(pathname, navLinks.map((l) => l.href));

  return (
    <header className="topbar">
      <div className="topbar__in">
        <Link href="/" className="wordmark">
          Labor<em>is</em>
        </Link>

        {dual && (
          <div className="hidden md:block">
            <RolePill />
          </div>
        )}

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                link.href === activeHrefValue
                  ? "text-[var(--brand-deep)] bg-surface-3"
                  : "text-ink-mid hover:text-ink hover:bg-surface-3"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="topbar__spacer" />

        <div className="flex items-center gap-2">
          <ModeToggle />
          <NotificationBell />

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="secondary" size="sm">
                Ingresar
              </Button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

      {dual && (
        <div className="md:hidden flex justify-center pb-3">
          <RolePill />
        </div>
      )}
    </header>
  );
}
