"use client";

import { useEffect, useMemo, useRef } from "react";

interface LocalPhotoPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxPhotos?: number;
}

/**
 * Variante de PhotoUploader que NO sube nada — mantiene los archivos
 * elegidos en memoria hasta que el formulario que lo usa decida subirlos
 * (por ejemplo, recién después de crear la entidad a la que van a quedar
 * asociados, cuando todavía no existe un id contra el cual subir).
 */
export default function LocalPhotoPicker({ files, onChange, maxPhotos = 6 }: LocalPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onChange([...files, file]);
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, i) => (
        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
          <img src={urls[i]} alt="Foto adjunta" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => handleRemove(i)}
            aria-label="Quitar foto"
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-surface-2 text-ink flex items-center justify-center shadow-sm"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M5 5 19 19M19 5 5 19" />
            </svg>
          </button>
        </div>
      ))}
      {files.length < maxPhotos && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center leading-none text-2xl text-ink-soft"
          aria-label="Agregar foto"
        >
          +
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
  );
}
