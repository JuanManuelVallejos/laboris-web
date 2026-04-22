const categories = [
  { icon: "🔧", label: "Plomero" },
  { icon: "🔥", label: "Gasista" },
  { icon: "⚡", label: "Electricista" },
  { icon: "🔐", label: "Cerrajero" },
  { icon: "🖌️", label: "Pintor" },
  { icon: "❄️", label: "Aire acond." },
  { icon: "🚨", label: "Urgente 24h" },
  { icon: "➕", label: "Ver todos" },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {categories.map((cat) => (
        <button
          key={cat.label}
          className="flex flex-col items-center gap-1.5 bg-surface rounded-2xl py-3 px-1 shadow-sm hover:shadow-md transition-shadow active:scale-95"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-[11px] font-medium text-ink text-center leading-tight">
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
