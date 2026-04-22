import { getProfessionals } from "@/lib/api";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import FilterChips from "@/components/FilterChips";
import CategoryGrid from "@/components/CategoryGrid";
import ProfessionalCard from "@/components/ProfessionalCard";

export default async function Home() {
  const professionals = await getProfessionals().catch(() => []);

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-4 pb-24 space-y-5 max-w-lg mx-auto w-full">

        {/* Búsqueda */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="¿Qué servicio necesitás?"
            className="w-full bg-surface border border-border rounded-2xl pl-9 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filtros */}
        <FilterChips />

        {/* Categorías */}
        <section>
          <h2 className="text-sm font-semibold text-ink mb-3">Servicios</h2>
          <CategoryGrid />
        </section>

        {/* Profesionales */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Disponibles cerca tuyo</h2>
            <button className="text-xs text-primary font-medium">ver más</button>
          </div>

          {professionals.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              No hay profesionales disponibles en tu zona.
            </p>
          ) : (
            <div className="space-y-3">
              {professionals.map((p) => (
                <ProfessionalCard key={p.id} professional={p} />
              ))}
            </div>
          )}
        </section>

      </main>

      <NavBottom />
    </div>
  );
}
