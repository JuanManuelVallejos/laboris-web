"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyProfessional, updateMyProfessional } from "@/lib/api";
import { TRADES, OTHER_TRADE_LABEL, ZONES } from "@/lib/catalog";
import { Field, Textarea } from "@/components/ui/Field";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";

const TRADE_OPTIONS = [...TRADES.map((t) => t.label), OTHER_TRADE_LABEL];

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
    <div className="flex flex-col min-h-screen bg-page">
      <header className="topbar">
        <div className="topbar__in">
          <Link href="/pro" className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h1 className="text-base font-semibold text-ink">Editar perfil</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
              <span className="field__label block mb-2">Oficio *</span>
              <div className="flex flex-wrap gap-2">
                {TRADE_OPTIONS.map((t) => (
                  <Chip key={t} active={trade === t.toLowerCase()} onClick={() => setTrade(t.toLowerCase())}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
              <span className="field__label block mb-2">Zona de trabajo *</span>
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z) => (
                  <Chip key={z} active={zone === z} onClick={() => setZone(z)}>
                    {z}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
              <Field label="Sobre vos" hint="Opcional — contá tu experiencia, años en el rubro, qué hacés mejor…">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contá tu experiencia, años en el rubro, qué hacés mejor..."
                  rows={4}
                />
              </Field>
            </div>

            {error && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}>
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" size="lg" block disabled={!trade || !zone || saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
