"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function RequestPage() {
  const router = useRouter();
  const params = useParams();
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/request-sent");
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">

      {/* Header */}
      <header className="bg-surface px-4 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10 border-b border-border">
        <Link href={`/professionals/${params.id}`} className="text-primary font-medium text-sm">←</Link>
        <h1 className="text-base font-semibold text-ink">Solicitar presupuesto</h1>
      </header>

      <main className="flex-1 px-4 pt-5 pb-32 md:pb-8 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-surface rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-muted mb-1">Enviando solicitud a</p>
            <p className="text-sm font-semibold text-ink">Profesional seleccionado</p>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-sm">
            <label className="text-sm font-semibold text-ink block mb-2">
              Describí el problema o trabajo
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Tengo una pérdida de agua en la cocina, debajo de la bacha..."
              rows={5}
              className="w-full text-sm text-ink placeholder:text-muted bg-cream rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              required
            />
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-ink mb-1">Adjuntá fotos</p>
            <p className="text-xs text-muted mb-3">Opcional — ayudan al profesional a entender mejor el trabajo</p>
            <button
              type="button"
              className="w-full border-2 border-dashed border-border rounded-xl py-5 text-sm text-muted flex flex-col items-center gap-1 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="text-xl">📎</span>
              <span>Subir foto</span>
            </button>
          </div>

          {/* Inline submit on desktop */}
          <div className="hidden md:block pt-2">
            <button
              type="submit"
              disabled={!description.trim()}
              className="w-full bg-primary text-surface font-semibold py-3.5 rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Enviar solicitud
            </button>
          </div>

        </form>
      </main>

      {/* Mobile CTA fijo */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-cream via-cream/90 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="w-full bg-primary text-surface font-semibold py-3.5 rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            Enviar solicitud
          </button>
        </div>
      </div>

    </div>
  );
}
