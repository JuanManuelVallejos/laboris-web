import Link from "next/link";

const navLinks = [
  { href: "/",        label: "Inicio" },
  { href: "/search",  label: "Buscar" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/perfil",  label: "Perfil" },
];

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

      <button
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-cream text-base"
        aria-label="Notificaciones"
      >
        🔔
      </button>

      {/* Desktop right side */}
      <div className="hidden md:flex items-center gap-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full bg-cream text-base hover:bg-border transition-colors"
          aria-label="Notificaciones"
        >
          🔔
        </button>
        <Link
          href="/perfil"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
        >
          U
        </Link>
      </div>
    </header>
  );
}
