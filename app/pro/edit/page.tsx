"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyProfessional, updateMyProfessional, uploadPortfolioPhoto, deletePortfolioPhoto } from "@/lib/api";
import { TRADES, OTHER_TRADE_LABEL } from "@/lib/catalog";
import { Field, Textarea } from "@/components/ui/Field";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import PhotoUploader from "@/components/ui/PhotoUploader";
import DistanceSlider from "@/components/ui/DistanceSlider";
import type { Attachment } from "@/lib/types";

const TRADE_OPTIONS = [...TRADES.map((t) => t.label), OTHER_TRADE_LABEL];

export default function EditProPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [trade,       setTrade]       = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [mapOpen,     setMapOpen]     = useState(false);
  const [radiusKm,    setRadiusKm]    = useState(10);
  const [bio,         setBio]         = useState("");
  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const canSubmit = !!trade && !!homeAddress.trim() && !mapOpen;

  useEffect(() => {
    getMyProfessional(getToken)
      .then((p) => {
        setTrade(p.trade);
        setHomeAddress(p.homeAddress ?? "");
        setRadiusKm(p.radiusKm ?? 10);
        setBio(p.bio ?? "");
        setPhotos(p.portfolioPhotos ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [getToken]);

  async function handleUploadPhoto(file: File) {
    const photo = await uploadPortfolioPhoto(file, getToken);
    setPhotos((prev) => [...prev, photo]);
  }

  async function handleDeletePhoto(id: string) {
    await deletePortfolioPhoto(id, getToken);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) { setSubmitAttempted(true); return; }
    setSaving(true);
    setError("");
    try {
      await updateMyProfessional({ trade, homeAddress: homeAddress.trim(), radiusKm, bio }, getToken);
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
            <div
              className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm"
              style={submitAttempted && !trade ? { borderColor: "var(--brand-alert)" } : undefined}
            >
              <span className="field__label block mb-2">Oficio *</span>
              <div className="flex flex-wrap gap-2">
                {TRADE_OPTIONS.map((t) => (
                  <Chip key={t} active={trade === t.toLowerCase()} onClick={() => setTrade(t.toLowerCase())}>
                    {t}
                  </Chip>
                ))}
              </div>
              {submitAttempted && !trade && (
                <p className="text-xs mt-2" style={{ color: "var(--brand-alert)" }}>Elegí un oficio.</p>
              )}
            </div>

            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
              <Field label="Tu domicilio *" hint="Desde acá se calcula qué tan lejos podés llegar a trabajar">
                <AddressAutocomplete currentValue={homeAddress} onSelect={setHomeAddress} onUnconfirmedChange={setMapOpen} highlightUnconfirmed={submitAttempted} />
              </Field>
            </div>

            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
              <DistanceSlider label="Radio de alcance" value={radiusKm} onChange={setRadiusKm} min={1} max={50} />
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

            <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
              <span className="field__label block mb-2">Fotos de tu portfolio</span>
              <PhotoUploader photos={photos} onUpload={handleUploadPhoto} onDelete={handleDeletePhoto} />
            </div>

            {error && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}>
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" size="lg" block disabled={saving} aria-disabled={!canSubmit}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
