"use client";

import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { completeOnboarding } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  async function handleRole(role: "client" | "professional") {
    if (role === "professional") {
      router.push("/onboarding/professional");
      return;
    }

    await completeOnboarding(
      {
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        fullName: user?.fullName ?? "",
        role: "client",
      },
      getToken
    );

    await user?.update({ unsafeMetadata: { onboardingComplete: true, roles: ["client"] } });
    router.push("/");
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-ink">¿Cómo vas a usar Laboris?</h1>
          <p className="text-sm text-muted">Podés cambiar esto después desde tu perfil</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleRole("client")}
            className="w-full bg-surface border-2 border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="text-3xl mb-2">🏠</div>
            <p className="font-semibold text-ink text-base">Busco servicios</p>
            <p className="text-sm text-muted mt-0.5">Necesito contratar un profesional para mi hogar</p>
          </button>

          <button
            onClick={() => handleRole("professional")}
            className="w-full bg-surface border-2 border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all active:scale-95"
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
