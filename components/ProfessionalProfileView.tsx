"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icons/Icon";
import PhotoGallery from "@/components/ui/PhotoGallery";
import StarRating from "@/components/ui/StarRating";
import { getProfessionalReviews } from "@/lib/api";
import type { Professional, Review } from "@/lib/types";

interface ProfessionalProfileViewProps {
  professional: Professional;
  /**
   * Si se pasa, es la vista propia del profesional (no la pública): aparece
   * un lápiz de edición junto al avatar, y las secciones vacías (bio,
   * portfolio) muestran una invitación a completarlas en vez de ocultarse.
   */
  editHref?: string;
  /**
   * Foto a mostrar, con prioridad sobre professional.avatarUrl. La vista
   * propia (Perfil) pasa acá user.imageUrl de Clerk, que siempre está
   * actualizado, en vez de depender de que el webhook ya haya sincronizado
   * professional.avatarUrl. La vista pública no la pasa.
   */
  avatarUrl?: string;
  /** Si se pasa, se muestra debajo del nombre (solo tiene sentido en la vista propia). */
  email?: string;
}

export default function ProfessionalProfileView({ professional, editHref, avatarUrl, email }: ProfessionalProfileViewProps) {
  const ratingText = professional.rating > 0 ? professional.rating.toFixed(1) : "Sin calificación";
  const isOwner = !!editHref;
  const avatar = avatarUrl ?? professional.avatarUrl;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    getProfessionalReviews(professional.id)
      .then(setReviews)
      .finally(() => setReviewsLoading(false));
  }, [professional.id]);

  return (
    <>
      {/* Avatar + info principal */}
      <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 relative">
        <div className="pro-av" style={{ width: 64, height: 64, fontSize: "var(--t-h2)", marginBottom: 0 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={professional.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            professional.name[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="serif text-lg font-bold text-ink">{professional.name}</h2>
            {professional.verified && <span className="badge badge--verif">✓ verificado</span>}
          </div>
          {email && <p className="text-sm text-ink-soft mt-0.5 truncate">{email}</p>}
          <p className="text-sm text-ink-soft capitalize mt-0.5">
            {professional.trade}
            {isOwner && professional.radiusKm !== undefined && ` · Radio ${professional.radiusKm} km`}
            {!isOwner && professional.distanceKm !== undefined && ` · a ${professional.distanceKm.toFixed(1)} km`}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {professional.rating > 0 && <StarRating rating={professional.rating} size={14} />}
            <span className="text-sm font-medium" style={{ color: "var(--amber)" }}>{ratingText}</span>
            {reviews.length > 0 && <span className="text-xs text-ink-soft">({reviews.length})</span>}
          </div>
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

      {/* Domicilio */}
      {isOwner && professional.homeAddress && (
        <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-2">Domicilio</h3>
          <p className="text-sm text-ink-mid leading-relaxed">{professional.homeAddress}</p>
        </div>
      )}

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

      {/* Reseñas */}
      <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-ink mb-3">Reseñas</h3>
        {reviewsLoading ? (
          <div className="h-16 rounded-xl bg-surface-3 animate-pulse" />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-ink-soft">Todavía no tiene reseñas.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-ink">{r.reviewerName}</p>
                  <StarRating rating={r.rating} size={13} />
                </div>
                {r.comment && <p className="text-sm text-ink-mid leading-relaxed">{r.comment}</p>}
                <p className="text-xs text-ink-soft mt-1">
                  {new Date(r.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Calificación", value: ratingText },
          isOwner
            ? { label: "Radio", value: professional.radiusKm !== undefined ? `${professional.radiusKm} km` : "—" }
            : { label: "Distancia", value: professional.distanceKm !== undefined ? `a ${professional.distanceKm.toFixed(1)} km` : "—" },
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
