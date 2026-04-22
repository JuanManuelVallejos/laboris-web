const chips = ["Todos", "Urgente", "Zona sur", "Mejor calificado"];

export default function FilterChips() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {chips.map((chip, i) => (
        <button
          key={chip}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            i === 0
              ? "bg-primary text-surface border-primary"
              : "bg-surface text-muted border-border hover:border-primary hover:text-primary"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
