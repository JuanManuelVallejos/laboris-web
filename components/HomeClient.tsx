"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ProfessionalCard from "@/components/ProfessionalCard";
import SearchBox from "@/components/ui/SearchBox";
import CategoryGrid from "@/components/ui/CategoryGrid";
import UrgencyCard from "@/components/ui/UrgencyCard";
import DistanceSlider from "@/components/ui/DistanceSlider";
import { TRADES } from "@/lib/catalog";
import { getMyProfessional, getProfessionals, AddressRequiredError, UserNotOnboardedError } from "@/lib/api";
import type { Professional } from "@/lib/types";
import { useActiveRole } from "@/lib/useActiveRole";

export default function HomeClient() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { hasProfessional } = useActiveRole();
  const router = useRouter();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,        setSearch]        = useState("");
  const [activeTrade,   setActiveTrade]   = useState<string | null>(null);
  const [distanceLimit, setDistanceLimit] = useState(0);
  const [ownProfessionalId, setOwnProfessionalId] = useState<string | null>(null);
  const [checkedOwnId, setCheckedOwnId] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    getProfessionals(getToken)
      .then(setProfessionals)
      .catch((e) => {
        if (e instanceof UserNotOnboardedError) { router.replace("/onboarding"); return; }
        if (e instanceof AddressRequiredError) { router.replace("/onboarding/address"); return; }
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, getToken, router]);

  // Si el usuario también es profesional, no debe verse a sí mismo en el
  // listado ni poder pedirse presupuesto (ver también la validación
  // equivalente en el backend, RequestUseCase.Create). Hasta confirmar esto
  // el listado se muestra vacío, para no pintar la propia ficha un instante
  // y que después desaparezca.
  useEffect(() => {
    if (!isLoaded) return;
    if (!hasProfessional) { setCheckedOwnId(true); return; }
    getMyProfessional(getToken)
      .then((p) => setOwnProfessionalId(p.id))
      .catch(() => {})
      .finally(() => setCheckedOwnId(true));
  }, [isLoaded, hasProfessional, getToken]);

  const filtered = useMemo(() => {
    if (!checkedOwnId) return [];
    return professionals.filter((p) => {
      if (p.id === ownProfessionalId) return false;
      const matchName     = p.name.toLowerCase().includes(search.toLowerCase());
      const matchTrade    = !activeTrade || p.trade.toLowerCase() === activeTrade;
      const matchDistance = distanceLimit === 0 || (p.distanceKm !== undefined && p.distanceKm <= distanceLimit);
      return matchName && matchTrade && matchDistance;
    });
  }, [professionals, ownProfessionalId, checkedOwnId, search, activeTrade, distanceLimit]);

  const isFiltering = Boolean(activeTrade || distanceLimit > 0 || search);

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
      </div>

      {/* Distancia */}
      <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
        <DistanceSlider
          label="Distancia máxima"
          value={distanceLimit}
          onChange={setDistanceLimit}
          min={0}
          max={50}
          unlimitedLabel="Cualquier distancia"
        />
      </div>

      {/* Servicios */}
      <section>
        <div className="sec-head mb-3">
          <span className="sec-title">Servicios</span>
          {isFiltering && (
            <button
              onClick={() => { setActiveTrade(null); setDistanceLimit(0); setSearch(""); }}
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
            {isFiltering ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}` : "Profesionales que llegan a tu domicilio"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="text-xs text-ink-soft">Probá con otro oficio o ampliá la distancia</p>
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
