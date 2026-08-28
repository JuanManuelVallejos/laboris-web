"use client";

import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { completeOnboarding } from "@/lib/api";
import { Field, TextInput, Textarea } from "@/components/ui/Field";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import DistanceSlider from "@/components/ui/DistanceSlider";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { TRADES, OTHER_TRADE_LABEL } from "@/lib/catalog";

const TRADE_OPTIONS = [...TRADES.map((t) => t.label), OTHER_TRADE_LABEL];

export default function ProfessionalOnboardingPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [fullName,    setFullName]    = useState(user?.fullName ?? "");
  const [trade,       setTrade]       = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [mapOpen,     setMapOpen]     = useState(false);
  const [radiusKm,    setRadiusKm]    = useState(10);
  const [bio,         setBio]         = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const canSubmit = fullName.trim() && trade && homeAddress.trim() && !mapOpen;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) { setSubmitAttempted(true); return; }
    setLoading(true);
    setError("");

    try {
      const email = user?.primaryEmailAddress?.emailAddress ?? "";

      // Actualizar nombre en Clerk
      const [firstName, ...rest] = fullName.trim().split(" ");
      await user?.update({ firstName, lastName: rest.join(" ") || undefined });

      // Crear usuario + profesional en la DB
      await completeOnboarding({ email, fullName: fullName.trim(), role: "professional", trade, homeAddress: homeAddress.trim(), radiusKm, bio }, getToken);

      // Marcar onboarding completo y hacer reload para refrescar JWT.
      // Sumamos al array existente en vez de pisarlo, para no perder el rol
      // de cliente si este usuario ya lo tenía.
      const existing = (user?.unsafeMetadata?.roles as string[] | undefined) ?? [];
      const roles = Array.from(new Set([...existing, "professional"]));
      await user?.update({ unsafeMetadata: { onboardingComplete: true, roles } });
      window.location.replace("/pro");
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <header className="topbar">
        <div className="topbar__in">
          <Link href="/onboarding" className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" className="ico" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h1 className="text-base font-semibold text-ink">Tu perfil profesional</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <Field label="Tu nombre *">
              <TextInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Vallejo"
                style={submitAttempted && !fullName.trim() ? { borderColor: "var(--brand-alert)" } : undefined}
              />
            </Field>
            {submitAttempted && !fullName.trim() && (
              <p className="text-xs mt-1" style={{ color: "var(--brand-alert)" }}>Completá tu nombre.</p>
            )}
          </div>

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
              <AddressAutocomplete onSelect={setHomeAddress} onUnconfirmedChange={setMapOpen} highlightUnconfirmed={submitAttempted} />
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

          {error && (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}
            >
              {error}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" block disabled={loading} aria-disabled={!canSubmit}>
            {loading ? "Guardando..." : "Crear mi perfil"}
          </Button>

        </form>
      </main>
    </div>
  );
}
