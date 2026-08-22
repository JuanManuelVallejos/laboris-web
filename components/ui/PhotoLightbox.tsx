"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/icons/Icon";
import type { Attachment } from "@/lib/types";

interface PhotoLightboxProps {
  photos: Attachment[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Visualizador de fotos a pantalla completa. Genérico — recibe cualquier
 * lista de Attachment, usado tanto en la galería pública del profesional
 * como en la grilla de gestión de PhotoUploader.
 */
export default function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const hasMultiple = photos.length > 1;

  function goPrev() {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function goNext() {
    setIndex((i) => (i + 1) % photos.length);
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasMultiple) goPrev();
      else if (e.key === "ArrowRight" && hasMultiple) goNext();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultiple]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-2 text-ink flex items-center justify-center shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 5 19 19M19 5 5 19" />
        </svg>
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Foto anterior"
          className="absolute left-2 md:left-4 w-9 h-9 rounded-full bg-surface-2 text-ink flex items-center justify-center shadow-sm"
        >
          <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
        </button>
      )}

      <img
        src={photo.url}
        alt="Foto de portfolio"
        className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Foto siguiente"
          className="absolute right-2 md:right-4 w-9 h-9 rounded-full bg-surface-2 text-ink flex items-center justify-center shadow-sm"
        >
          <Icon name="arrow" style={{ width: 18, height: 18 }} />
        </button>
      )}
    </div>
  );
}
