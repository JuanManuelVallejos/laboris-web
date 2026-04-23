"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyProfessional, updateMyProfessional } from "@/lib/api";

const trades = ["Plomero", "Gasista", "Electricista", "Cerrajero", "Pintor", "Aire acond.", "Carpintero", "Otro"];
const zones  = ["CABA", "Zona Norte", "Zona Sur", "Zona Oeste", "GBA"];

export default function EditProPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [trade, setTrade] = useState("");
  const [zone,  setZone]  = useState("");
  const [bio,   setBio]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    getMyProfessional(getToken)
      .then((p) => {
        setTrade(p.trade);
        setZone(p.zone);
        setBio(p.bio ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [getToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trade || !zone) return;
    setSaving(true);
    setError("");
    try {
      await updateMyProfessional({ trade, zone, bio }, getToken);
      router.push("/pro");
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <header className="bg-surface px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border sticky top-0 z-10">
        <Link href="/pro" className="text-primary font-medium text-sm">←</Link>
        <h1 className="text-base font-semibold text-ink">Editar perfil</h1>
      </header>

      <main className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 shadow-sm h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-surface rounded-2xl p-4 shadow-sm">
              <label className="text-sm font-semibold text-ink block mb-2">Oficio *</label>
              <div className="grid grid-cols-2 gap-2">
                {trades.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrade(t.toLowerCase())}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      trade === t.toLowerCase()
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-4 shadow-sm">
              <label className="text-sm font-semibold text-ink block mb-2">Zona de trabajo *</label>
              <div className="flex flex-wrap gap-2">
                {zones.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(z)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      zone === z
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted hover:border-primary/40"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-4 shadow-sm">
              <label className="text-sm font-semibold text-ink block mb-2">
                Sobre vos <span className="text-muted font-normal">(opcional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contá tu experiencia, años en el rubro, qué hacés mejor..."
                rows={4}
                className="w-full text-sm text-ink placeholder:text-muted bg-cream rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={!trade || !zone || saving}
              className="w-full bg-primary text-surface font-semibold py-3.5 rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
