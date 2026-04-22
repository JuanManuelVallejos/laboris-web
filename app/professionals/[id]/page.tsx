import Link from "next/link";
import NavBottom from "@/components/NavBottom";
import { getProfessional } from "@/lib/api";

export default async function ProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professional = await getProfessional(id).catch(() => null);

  if (!professional) {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <div className="px-4 pt-5 pb-24 max-w-lg mx-auto w-full">
          <Link href="/" className="text-primary text-sm font-medium">← Volver</Link>
          <p className="text-muted mt-6 text-center">Profesional no encontrado.</p>
        </div>
        <NavBottom />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">

      {/* Header */}
      <header className="bg-surface px-4 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10 border-b border-border">
        <Link href="/" className="text-primary font-medium text-sm">←</Link>
        <h1 className="text-base font-semibold text-ink truncate">{professional.name}</h1>
      </header>

      <main className="flex-1 px-4 pt-5 pb-32 md:pb-8 max-w-5xl mx-auto w-full">

        {/* Desktop: 2-column layout */}
        <div className="md:grid md:grid-cols-[1fr_320px] md:gap-6 space-y-4 md:space-y-0">

          {/* Left column */}
          <div className="space-y-4">
            {/* Avatar + info principal */}
            <div className="bg-surface rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">{professional.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-ink">{professional.name}</h2>
                  {professional.verified && (
                    <span className="text-[11px] bg-verified/10 text-verified font-semibold px-2 py-0.5 rounded-full">
                      verificado ✓
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted capitalize mt-0.5">{professional.trade} · {professional.zone}</p>
                <p className="text-sm text-amber-500 font-medium mt-1">★ {professional.rating}</p>
              </div>
            </div>

            {/* Sobre mí */}
            <div className="bg-surface rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-ink mb-2">Sobre mí</h3>
              <p className="text-sm text-muted leading-relaxed">
                Profesional con experiencia en {professional.trade.toLowerCase()}. Trabajo en {professional.zone} con atención personalizada y garantía en todos los trabajos.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Calificación", value: `★ ${professional.rating}` },
                { label: "Zona", value: professional.zone },
                { label: "Estado", value: professional.verified ? "Verificado" : "No verificado" },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface rounded-2xl p-3 shadow-sm text-center">
                  <p className="text-xs text-muted mb-1">{stat.label}</p>
                  <p className="text-xs font-semibold text-ink leading-tight">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — sticky CTA on desktop */}
          <div className="hidden md:block">
            <div className="sticky top-20 bg-surface rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink">{professional.name}</p>
                <p className="text-xs text-muted capitalize">{professional.trade} · {professional.zone}</p>
                <p className="text-sm text-amber-500 font-medium mt-1">★ {professional.rating}</p>
              </div>
              <Link
                href={`/professionals/${id}/request`}
                className="block w-full bg-primary text-surface text-center font-semibold py-3.5 rounded-2xl shadow-md hover:bg-primary/90 transition-colors"
              >
                Solicitar presupuesto
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile CTA fijo */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-cream via-cream/90 to-transparent pt-4">
        <div className="max-w-lg mx-auto">
          <Link
            href={`/professionals/${id}/request`}
            className="block w-full bg-primary text-surface text-center font-semibold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            Solicitar presupuesto
          </Link>
        </div>
      </div>

      <NavBottom />
    </div>
  );
}
