"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { completeOnboarding } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRole(role: "client" | "professional") {
    if (role === "professional") {
      router.push("/onboarding/professional");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const email    = user?.primaryEmailAddress?.emailAddress ?? "";
      const fullName = user?.fullName ?? user?.firstName ?? email.split("@")[0] ?? "Usuario";

      await completeOnboarding({ email, fullName, role: "client" }, getToken);
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

      </div>
    </div>
  );
}
