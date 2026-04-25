"use client";

import Link from "next/link";
import { Show, UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  getUnreadCount,
  getNotifications,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api";

const navLinks = [
  { href: "/",        label: "Inicio" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/perfil",  label: "Perfil" },
];

function NotificationBell() {
  const { isSignedIn, getToken } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    const fetchCount = () =>
      getUnreadCount(getToken).then(setUnread).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
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
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-cream text-base hover:bg-border transition-colors"
        aria-label="Notificaciones"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(320px,calc(100vw-2rem))] bg-surface rounded-2xl shadow-lg border border-border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-ink">Notificaciones</p>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No tenés notificaciones
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm text-ink">{n.message}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(n.createdAt).toLocaleString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  return (
    <header className="bg-surface px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 border-b border-border">
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Laboris</h1>
          <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
            <span>📍</span>
            <span>Buenos Aires</span>
          </p>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-cream transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Auth + notifications */}
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationBell />

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-primary px-3 py-1.5 rounded-xl border border-primary/30 hover:bg-primary/5 transition-colors md:hidden">
              Ingresar
            </button>
          </SignInButton>
          <SignInButton mode="modal">
            <button className="hidden md:block text-sm font-semibold text-surface bg-primary px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
              Ingresar
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
