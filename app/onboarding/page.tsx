"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { completeOnboarding } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [step,     setStep]     = useState<"name" | "role">("name");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleRole(role: "client" | "professional") {
    if (role === "professional") {
      // Guardamos el nombre antes de ir al paso profesional
      const [firstName, ...rest] = fullName.trim().split(" ");
      await user?.update({ firstName, lastName: rest.join(" ") || undefined });
      router.push("/onboarding/professional");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const email = user?.primaryEmailAddress?.emailAddress ?? "";
      const [firstName, ...rest] = fullName.trim().split(" ");
      await user?.update({ firstName, lastName: rest.join(" ") || undefined });
      await completeOnboarding({ email, fullName: fullName.trim(), role: "client" }, getToken);
      await user?.update({ unsafeMetadata: { onboardingComplete: true, roles: ["client"] } });
      window.location.replace("/");
    } catch (err) {
      setError("Ocurrió un error. Intentá de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">

        {step === "name" ? (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-ink">¿Cómo te llamás?</h1>
              <p className="text-sm text-muted">Así te van a ver los demás usuarios</p>
            </div>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Juan Vallejo"
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />

            <button
              onClick={() => setStep("role")}
              disabled={!fullName.trim()}
              className="w-full bg-primary text-surface font-semibold py-3.5 rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Continuar
            </button>
          </>
        ) : (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-ink">¿Cómo vas a usar Laboris?</h1>
              <p className="text-sm text-muted">Podés cambiar esto después desde tu perfil</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 text-center">{error}</p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleRole("client")}
                disabled={loading}
                className="w-full bg-surface border-2 border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <div className="text-3xl mb-2">🏠</div>
                <p className="font-semibold text-ink text-base">Busco servicios</p>
                <p className="text-sm text-muted mt-0.5">Necesito contratar un profesional para mi hogar</p>
              </button>

              <button
                onClick={() => handleRole("professional")}
                disabled={loading}
                className="w-full bg-surface border-2 border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <div className="text-3xl mb-2">🔧</div>
                <p className="font-semibold text-ink text-base">Soy profesional</p>
                <p className="text-sm text-muted mt-0.5">Ofrezco servicios y quiero conseguir clientes</p>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
