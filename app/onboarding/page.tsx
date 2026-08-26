"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { completeOnboarding } from "@/lib/api";
import { Field, TextInput } from "@/components/ui/Field";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [fullName,    setFullName]    = useState(user?.fullName ?? "");
  const [homeAddress, setHomeAddress] = useState("");
  const [step,        setStep]        = useState<"name" | "role" | "address">("name");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleRole(role: "client" | "professional") {
    // Guardamos el nombre antes de avanzar
    const [firstName, ...rest] = fullName.trim().split(" ");
    await user?.update({ firstName, lastName: rest.join(" ") || undefined });

    if (role === "professional") {
      router.push("/onboarding/professional");
      return;
    }
    setStep("address");
  }

  async function handleFinishClient(e: React.FormEvent) {
    e.preventDefault();
    if (!homeAddress.trim()) return;
    setLoading(true);
    setError("");
    try {
      const email = user?.primaryEmailAddress?.emailAddress ?? "";
      await completeOnboarding({ email, fullName: fullName.trim(), role: "client", homeAddress: homeAddress.trim() }, getToken);
      const existing = (user?.unsafeMetadata?.roles as string[] | undefined) ?? [];
      const roles = Array.from(new Set([...existing, "client"]));
      await user?.update({ unsafeMetadata: { onboardingComplete: true, roles } });
      window.location.replace("/");
    } catch (err) {
      setError("Ocurrió un error. Intentá de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-page items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">

        {step === "address" ? (
          <form onSubmit={handleFinishClient} className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="serif text-2xl font-bold text-ink">¿Dónde estás ubicado?</h1>
              <p className="text-sm text-ink-soft">Así te mostramos profesionales que pueden llegar a tu domicilio</p>
            </div>

            {error && (
              <p
                className="text-sm rounded-xl px-4 py-3 text-center"
                style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}
              >
                {error}
              </p>
            )}

            <Field label="Tu domicilio">
              <AddressAutocomplete onSelect={setHomeAddress} />
            </Field>

            <Button type="submit" variant="accent" size="lg" block disabled={!homeAddress.trim() || loading}>
              {loading ? "Guardando..." : "Terminar"}
            </Button>
          </form>
        ) : step === "name" ? (
          <>
            <div className="text-center space-y-1">
              <h1 className="serif text-2xl font-bold text-ink">¿Cómo te llamás?</h1>
              <p className="text-sm text-ink-soft">Así te van a ver los demás usuarios</p>
            </div>

            <Field>
              <TextInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Vallejo"
                autoFocus
              />
            </Field>

            <Button
              variant="accent"
              size="lg"
              block
              onClick={() => setStep("role")}
              disabled={!fullName.trim()}
            >
              Continuar
            </Button>
          </>
        ) : (
          <>
            <div className="text-center space-y-1">
              <h1 className="serif text-2xl font-bold text-ink">¿Cómo vas a usar Laboris?</h1>
              <p className="text-sm text-ink-soft">Podés cambiar esto después desde tu perfil</p>
            </div>

            {error && (
              <p
                className="text-sm rounded-xl px-4 py-3 text-center"
                style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}
              >
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleRole("client")}
                disabled={loading}
                className="w-full bg-surface-2 border-2 border-border rounded-2xl p-5 text-left hover:border-brand-vivid hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="cat-icon" style={{ marginBottom: "var(--s-2)" }}>
                  <Icon name="home" className="ico" />
                </span>
                <p className="font-semibold text-ink text-base mt-3">Busco servicios</p>
                <p className="text-sm text-ink-soft mt-0.5">Necesito contratar un profesional para mi hogar</p>
              </button>

              <button
                onClick={() => handleRole("professional")}
                disabled={loading}
                className="w-full bg-surface-2 border-2 border-border rounded-2xl p-5 text-left hover:border-brand-vivid hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="cat-icon" style={{ marginBottom: "var(--s-2)" }}>
                  <Icon name="hammer" className="ico" />
                </span>
                <p className="font-semibold text-ink text-base mt-3">Soy profesional</p>
                <p className="text-sm text-ink-soft mt-0.5">Ofrezco servicios y quiero conseguir clientes</p>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
