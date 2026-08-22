"use client";

import { useState } from "react";
import PhotoLightbox from "@/components/ui/PhotoLightbox";
import type { Attachment } from "@/lib/types";

export default function ProfessionalPortfolioGallery({ photos }: { photos: Attachment[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="w-20 h-20 rounded-xl overflow-hidden border border-border"
            aria-label="Ver foto"
          >
            <img src={photo.url} alt="Foto de portfolio" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <PhotoLightbox photos={photos} initialIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
