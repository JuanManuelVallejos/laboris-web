import Link from "next/link";
import NavBottom from "@/components/NavBottom";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import ProfessionalProfileView from "@/components/ProfessionalProfileView";
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
            <ProfessionalProfileView professional={professional} />
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
