"use client";

import { useRef, useState } from "react";
import type { Attachment } from "@/lib/types";

interface PhotoUploaderProps {
  photos: Attachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  maxPhotos?: number;
}

/**
 * Grilla de miniaturas + tile para agregar foto. Genérico a propósito — no
 * sabe nada de "portfolio" específicamente, para poder reusarlo más adelante
 * en fotos de solicitud o galería de reseñas con las mismas props.
 */
export default function PhotoUploader({ photos, onUpload, onDelete, maxPhotos = 6 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al borrar la foto");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
            <img src={photo.url} alt="Foto de portfolio" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(photo.id)}
              disabled={deletingId === photo.id}
              aria-label="Eliminar foto"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-surface-2 text-ink text-xs font-bold flex items-center justify-center shadow-sm"
              style={{ opacity: deletingId === photo.id ? 0.5 : 1 }}
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-2xl text-ink-soft"
            aria-label="Agregar foto"
          >
            {uploading ? "…" : "+"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs" style={{ color: "var(--brand-alert)" }}>{error}</p>}
    </div>
  );
}
