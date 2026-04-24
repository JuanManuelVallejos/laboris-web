"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";

export default function PerfilPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  const roles = user?.unsafeMetadata?.roles as string[] | undefined;
  if (isLoaded && roles?.includes("professional")) {
    router.replace("/pro");
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <Topbar />
        <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
          <div className="bg-surface rounded-2xl p-6 shadow-sm animate-pulse h-32" />
        </main>
        <NavBottom />
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name  = user?.fullName ?? user?.firstName ?? "Usuario";
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
        <h2 className="text-lg font-bold text-ink">Mi perfil</h2>

        {/* Avatar + datos */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink text-base">{name}</p>
            <p className="text-sm text-muted mt-0.5 truncate">{email}</p>
            <span className="mt-1.5 inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Cliente
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-surface rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
          <a
            href="/pedidos"
            className="flex items-center justify-between px-5 py-4 hover:bg-cream transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium text-ink">Mis pedidos</span>
            </div>
            <span className="text-muted text-sm">›</span>
          </a>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          className="w-full bg-surface border border-border text-red-600 font-semibold py-3.5 rounded-2xl hover:bg-red-50 transition-colors text-sm"
        >
          Cerrar sesión
        </button>
      </main>

      <NavBottom />
    </div>
  );
}
