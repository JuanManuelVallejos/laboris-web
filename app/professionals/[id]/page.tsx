import Link from "next/link";
import NavBottom from "@/components/NavBottom";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import PhotoGallery from "@/components/ui/PhotoGallery";
import { getProfessional } from "@/lib/api";

export default async function ProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professional = await getProfessional(id).catch(() => null);

  if (!professional) {
    return (
      <div className="flex flex-col min-h-screen bg-page">
        <div className="px-4 pt-5 pb-24 max-w-lg mx-auto w-full">
          <Link href="/" className="text-brand-vivid text-sm font-medium">← Volver</Link>
          <p className="text-ink-soft mt-6 text-center">Profesional no encontrado.</p>
        </div>
        <NavBottom />
      </div>
    );
  }

  const ratingText = professional.rating > 0 ? `★ ${professional.rating}` : "Sin calificación";

  return (
    <div className="flex flex-col min-h-screen bg-page">

      {/* Header */}
      <header className="topbar">
        <div className="topbar__in">
          <Link href="/" className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h1 className="text-base font-semibold text-ink truncate">{professional.name}</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-32 md:pb-8 max-w-5xl mx-auto w-full">

        {/* Desktop: 2-column layout */}
        <div className="md:grid md:grid-cols-[1fr_320px] md:gap-6 space-y-4 md:space-y-0">

          {/* Left column */}
          <div className="space-y-4">
            {/* Avatar + info principal */}
            <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="pro-av" style={{ width: 64, height: 64, fontSize: "var(--t-h2)", marginBottom: 0 }}>
                {professional.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="serif text-lg font-bold text-ink">{professional.name}</h2>
                  {professional.verified && <span className="badge badge--verif">✓ verificado</span>}
                </div>
                <p className="text-sm text-ink-soft capitalize mt-0.5">{professional.trade} · {professional.zone}</p>
                <p className="text-sm font-medium mt-1" style={{ color: "var(--amber)" }}>{ratingText}</p>
              </div>
            </div>

            {/* Sobre mí */}
            {professional.bio && (
              <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink mb-2">Sobre mí</h3>
                <p className="text-sm text-ink-mid leading-relaxed">{professional.bio}</p>
              </div>
            )}

            {/* Portfolio */}
            {professional.portfolioPhotos && professional.portfolioPhotos.length > 0 && (
              <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink mb-2">Portfolio</h3>
                <PhotoGallery photos={professional.portfolioPhotos} />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Calificación", value: ratingText },
                { label: "Zona", value: professional.zone },
                { label: "Estado", value: professional.verified ? "Verificado" : "No verificado" },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-2 border border-border rounded-2xl p-3 shadow-sm text-center">
                  <p className="text-xs text-ink-soft mb-1">{stat.label}</p>
                  <p className="text-xs font-semibold text-ink leading-tight">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — sticky CTA on desktop */}
          <div className="hidden md:block">
            <div className="sticky top-20 bg-surface-2 border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink">{professional.name}</p>
                <p className="text-xs text-ink-soft capitalize">{professional.trade} · {professional.zone}</p>
                <p className="text-sm font-medium mt-1" style={{ color: "var(--amber)" }}>{ratingText}</p>
              </div>
              <Link href={`/professionals/${id}/request`} className="block">
                <Button variant="accent" size="lg" block>Solicitar presupuesto</Button>
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile CTA fijo */}
      <div
        className="md:hidden fixed bottom-16 left-0 right-0 px-4 pb-2 pt-4"
        style={{ background: "linear-gradient(to top, var(--page), color-mix(in srgb, var(--page) 90%, transparent), transparent)" }}
      >
        <div className="max-w-lg mx-auto">
          <Link href={`/professionals/${id}/request`} className="block">
            <Button variant="accent" size="lg" block className="active:scale-95 transition-transform">
              Solicitar presupuesto
            </Button>
          </Link>
        </div>
      </div>

      <NavBottom />
    </div>
  );
}
