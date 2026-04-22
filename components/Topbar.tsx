export default function Topbar() {
  return (
    <header className="bg-surface px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 border-b border-border">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">Laboris</h1>
        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
          <span>📍</span>
          <span>Buenos Aires</span>
        </p>
      </div>
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full bg-cream text-base"
        aria-label="Notificaciones"
      >
        🔔
      </button>
    </header>
  );
}
