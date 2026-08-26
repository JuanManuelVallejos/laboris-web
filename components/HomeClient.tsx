"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import ProfessionalCard from "@/components/ProfessionalCard";
import SearchBox from "@/components/ui/SearchBox";
import LocationChip from "@/components/ui/LocationChip";
import Chip from "@/components/ui/Chip";
import CategoryGrid from "@/components/ui/CategoryGrid";
import UrgencyCard from "@/components/ui/UrgencyCard";
import { TRADES, ZONES } from "@/lib/catalog";
import { getMyProfessional } from "@/lib/api";
import type { Professional } from "@/lib/types";
import { useActiveRole } from "@/lib/useActiveRole";

const ALL_ZONES = "Todas";

interface Props {
  professionals: Professional[];
}

export default function HomeClient({ professionals }: Props) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { hasProfessional } = useActiveRole();
  const [search,      setSearch]      = useState("");
  const [activeTrade, setActiveTrade] = useState<string | null>(null);
  const [activeZone,  setActiveZone]  = useState<string>(ALL_ZONES);
  const [ownProfessionalId, setOwnProfessionalId] = useState<string | null>(null);

  // Si el usuario también es profesional, no debe verse a sí mismo en el
  // listado ni poder pedirse presupuesto (ver también la validación
  // equivalente en el backend, RequestUseCase.Create).
  useEffect(() => {
    if (!hasProfessional) return;
    getMyProfessional(getToken).then((p) => setOwnProfessionalId(p.id)).catch(() => {});
  }, [hasProfessional, getToken]);

  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      if (p.id === ownProfessionalId) return false;
      const matchName  = p.name.toLowerCase().includes(search.toLowerCase());
      const matchTrade = !activeTrade || p.trade.toLowerCase() === activeTrade;
      const matchZone  = activeZone === ALL_ZONES || p.zone === activeZone;
      return matchName && matchTrade && matchZone;
    });
  }, [professionals, ownProfessionalId, search, activeTrade, activeZone]);

  const isFiltering = Boolean(activeTrade || activeZone !== ALL_ZONES || search);

  function toggleTrade(value: string) {
    setActiveTrade((prev) => (prev === value ? null : value));
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="hero">
        <p className="text-xs" style={{ color: "rgba(255,255,255,.55)" }}>
          Hola{user?.firstName ? `, ${user.firstName}` : ""} · <strong style={{ color: "rgba(255,255,255,.92)" }}>¿qué necesitás hoy?</strong>
        </p>
        <SearchBox
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Plomero, electricista…"
          containerClassName="mt-3"
        />
        <LocationChip label="Buenos Aires" className="mt-3" />
      </div>

      {/* Chips de zona */}
      <div className="scrollx gap-2">
        <Chip active={activeZone === ALL_ZONES} onClick={() => setActiveZone(ALL_ZONES)}>
          {ALL_ZONES}
        </Chip>
        {ZONES.map((z) => (
          <Chip key={z} active={activeZone === z} onClick={() => setActiveZone(z)}>
            {z}
          </Chip>
        ))}
      </div>

      {/* Servicios */}
      <section>
        <div className="sec-head mb-3">
          <span className="sec-title">Servicios</span>
          {isFiltering && (
            <button
              onClick={() => { setActiveTrade(null); setActiveZone(ALL_ZONES); setSearch(""); }}
              className="sec-link"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <CategoryGrid
          items={TRADES}
          activeValue={activeTrade}
          onSelect={toggleTrade}
        />
      </section>

      {/* Urgencia */}
      <UrgencyCard />

      {/* Resultados */}
      <section>
        <div className="sec-head mb-3">
          <span className="sec-title">
            {isFiltering ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}` : "Cerca tuyo"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="text-xs text-ink-soft">Probá con otro oficio o zona</p>
          </div>
        ) : isFiltering ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>
        ) : (
          <div className="scrollx gap-3">
            {filtered.map((p) => (
              <ProfessionalCard key={p.id} professional={p} className="w-[150px] shrink-0" />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
