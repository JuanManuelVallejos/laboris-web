import Link from "next/link";
import Icon from "@/components/icons/Icon";
import PhotoGallery from "@/components/ui/PhotoGallery";
import type { Professional } from "@/lib/types";

interface ProfessionalProfileViewProps {
  professional: Professional;
  /**
   * Si se pasa, es la vista propia del profesional (no la pública): aparece
   * un lápiz de edición junto al avatar, y las secciones vacías (bio,
   * portfolio) muestran una invitación a completarlas en vez de ocultarse.
   */
  editHref?: string;
}

export default function ProfessionalProfileView({ professional, editHref }: ProfessionalProfileViewProps) {
  const ratingText = professional.rating > 0 ? `★ ${professional.rating}` : "Sin calificación";
  const isOwner = !!editHref;

  return (
    <>
      {/* Avatar + info principal */}
      <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 relative">
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
        {editHref && (
          <Link
            href={editHref}
            aria-label="Editar perfil"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-3 text-ink-mid flex items-center justify-center shadow-sm hover:bg-border transition-colors"
          >
            <Icon name="edit" style={{ width: 16, height: 16 }} />
          </Link>
        )}
      </div>

      {/* Sobre mí */}
      {professional.bio ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-2">Sobre mí</h3>
          <p className="text-sm text-ink-mid leading-relaxed">{professional.bio}</p>
        </div>
      ) : isOwner ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-2">Sobre mí</h3>
          <p className="text-sm text-ink-soft">Agregá una bio para que los clientes te conozcan mejor.</p>
        </div>
      ) : null}

      {/* Portfolio */}
      {professional.portfolioPhotos && professional.portfolioPhotos.length > 0 ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-2">Portfolio</h3>
          <PhotoGallery photos={professional.portfolioPhotos} />
        </div>
      ) : isOwner ? (
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-2">Portfolio</h3>
          <p className="text-sm text-ink-soft">Todavía no subiste fotos a tu portfolio.</p>
        </div>
      ) : null}

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
    </>
  );
}
