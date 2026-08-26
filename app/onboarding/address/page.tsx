"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { updateMyAddress } from "@/lib/api";
import { Field } from "@/components/ui/Field";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Button from "@/components/ui/Button";

export default function AddressOnboardingPage() {
  const { getToken } = useAuth();

  const [homeAddress, setHomeAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeAddress.trim()) return;
    setLoading(true);
    setError("");
    try {
      await updateMyAddress(homeAddress.trim(), getToken);
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-page items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="serif text-2xl font-bold text-ink">¿Dónde estás ubicado?</h1>
          <p className="text-sm text-ink-soft">Necesitamos tu domicilio para mostrarte profesionales que pueden llegar hasta vos</p>
        </div>

        {error && (
          <p
            className="text-sm rounded-xl px-4 py-3 text-center"
            style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Tu domicilio">
            <AddressAutocomplete onSelect={setHomeAddress} />
          </Field>

          <Button type="submit" variant="accent" size="lg" block disabled={!homeAddress.trim() || loading}>
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
