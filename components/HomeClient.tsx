"use client";

import { useState, useMemo } from "react";
import ProfessionalCard from "@/components/ProfessionalCard";
import type { Professional } from "@/lib/types";

const trades = [
  { icon: "🔧", label: "Plomero",      value: "plomero" },
  { icon: "🔥", label: "Gasista",      value: "gasista" },
  { icon: "⚡", label: "Electricista", value: "electricista" },
  { icon: "🔐", label: "Cerrajero",    value: "cerrajero" },
  { icon: "🖌️", label: "Pintor",       value: "pintor" },
  { icon: "❄️", label: "Aire acond.",  value: "aire acond." },
  { icon: "🪚", label: "Carpintero",   value: "carpintero" },
];

const zones = ["Todas", "CABA", "Zona Norte", "Zona Sur", "Zona Oeste", "GBA"];

interface Props {
  professionals: Professional[];
}

export default function HomeClient({ professionals }: Props) {
  const [search,      setSearch]      = useState("");
  const [activeTrade, setActiveTrade] = useState<string | null>(null);
  const [activeZone,  setActiveZone]  = useState("Todas");

  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      const matchName  = p.name.toLowerCase().includes(search.toLowerCase());
      const matchTrade = !activeTrade || p.trade.toLowerCase() === activeTrade;
      const matchZone  = activeZone === "Todas" || p.zone === activeZone;
      return matchName && matchTrade && matchZone;
    });
  }, [professionals, search, activeTrade, activeZone]);

  function toggleTrade(value: string) {
    setActiveTrade((prev) => (prev === value ? null : value));
  }

  return (
    <div className="space-y-5">

      {/* Búsqueda */}
      <div className="relative md:max-w-xl">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="¿Qué servicio necesitás?"
          className="w-full bg-surface border border-border rounded-2xl pl-9 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Categorías */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">Servicios</h2>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {trades.map((t) => {
            const active = activeTrade === t.value;
            return (
              <button
                key={t.value}
                onClick={() => toggleTrade(t.value)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 shadow-sm transition-all active:scale-95 ${
                  active
                    ? "bg-primary/10 ring-2 ring-primary shadow-none"
                    : "bg-surface hover:shadow-md"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <span className={`text-[11px] font-medium text-center leading-tight ${active ? "text-primary" : "text-ink"}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filtro zona */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {zones.map((z) => (
          <button
            key={z}
            onClick={() => setActiveZone(z)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeZone === z
                ? "bg-primary text-surface border-primary"
                : "bg-surface text-muted border-border hover:border-primary hover:text-primary"
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">
            {filtered.length === professionals.length
              ? "Disponibles cerca tuyo"
              : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
          </h2>
          {(activeTrade || activeZone !== "Todas" || search) && (
            <button
              onClick={() => { setActiveTrade(null); setActiveZone("Todas"); setSearch(""); }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-2xl">🔍</p>
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="text-xs text-muted">Probá con otro oficio o zona</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
