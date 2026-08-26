"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ProfessionalProfileView from "@/components/ProfessionalProfileView";
import { Field, TextInput } from "@/components/ui/Field";
import { getMyProfessional, completeOnboarding } from "@/lib/api";
import type { Professional } from "@/lib/types";
import { useActiveRole } from "@/lib/useActiveRole";

export default function PerfilPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const { hasClient, hasProfessional, active, setActive } = useActiveRole();
  const [proProfile, setProProfile]   = useState<Professional | null>(null);
  const [profileError, setProfileError] = useState("");
  const [proLoading, setProLoading]   = useState(true);
  const [addingRole, setAddingRole]   = useState(false);
  const [newClientAddress, setNewClientAddress] = useState("");

  const isPro = active === "professional";

  useEffect(() => {
    if (!isLoaded || !isPro) { setProLoading(false); return; }
    getMyProfessional(getToken)
      .then(setProProfile)
      .catch((e) => setProfileError(e.message))
      .finally(() => setProLoading(false));
  }, [isLoaded, isPro, getToken]);

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  // Sumar el rol de cliente a una cuenta que hoy es solo profesional —
  // pide el domicilio inline, ya es obligatorio para poder usar Inicio.
  async function handleAddClientRole() {
    if (!user || !newClientAddress.trim()) return;
    setAddingRole(true);
    try {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      const fullName = user.fullName ?? user.firstName ?? "Usuario";
      await completeOnboarding({ email, fullName, role: "client", homeAddress: newClientAddress.trim() }, getToken);
      const existing = (user.unsafeMetadata?.roles as string[] | undefined) ?? [];
      const roles = Array.from(new Set([...existing, "client"]));
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, roles } });
      setActive("client");
      router.push("/");
    } catch (err) {
      console.error(err);
      setAddingRole(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-page">
        <Topbar />
        <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full">
          <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm animate-pulse h-32" />
        </main>
        <NavBottom />
      </div>
    );
  }

  const email    = user?.primaryEmailAddress?.emailAddress ?? "";
  const name     = user?.fullName ?? user?.firstName ?? "Usuario";
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <h2 className="serif text-lg font-bold text-ink">Mi perfil</h2>

        {/* Avatar + datos (cliente) */}
        {!isPro && (
          <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="pro-av" style={{ width: 64, height: 64, fontSize: "var(--t-h2)", marginBottom: 0 }}>
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-base">{name}</p>
              <p className="text-sm text-ink-soft mt-0.5 truncate">{email}</p>
              <div className="mt-1.5">
                <Badge tone="verif">Cliente</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Perfil profesional */}
        {isPro && proLoading && (
          <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm animate-pulse h-32" />
        )}

        {isPro && !proLoading && profileError && (
          <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm text-center space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--brand-alert)" }}>{profileError}</p>
            <p className="text-xs text-ink-soft">Tu perfil profesional no se encuentra en la base de datos.</p>
            <Link href="/onboarding/professional">
              <Button variant="secondary" size="sm">Completar perfil →</Button>
            </Link>
          </div>
        )}

        {isPro && !proLoading && proProfile && (
          <ProfessionalProfileView professional={proProfile} editHref="/pro/edit" avatarUrl={user?.imageUrl} email={email} />
        )}

        {/* Sumar el rol que falta */}
        {isPro && !hasClient && (
          <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm text-center space-y-3">
            <p className="text-sm font-medium text-ink">¿También buscás servicios?</p>
            <p className="text-xs text-ink-soft">Sumá tu perfil de cliente sin salir de tu cuenta.</p>
            <Field label="Tu domicilio">
              <TextInput
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                placeholder="Ej: Av. Corrientes 1234, CABA"
              />
            </Field>
            <Button variant="secondary" size="sm" onClick={handleAddClientRole} disabled={addingRole || !newClientAddress.trim()}>
              {addingRole ? "Sumando..." : "Sumar perfil de cliente"}
            </Button>
          </div>
        )}

        {!isPro && !hasProfessional && (
          <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm text-center space-y-3">
            <p className="text-sm font-medium text-ink">¿También ofrecés servicios?</p>
            <p className="text-xs text-ink-soft">Registrate como profesional y empezá a recibir pedidos.</p>
            <Link href="/onboarding/professional">
              <Button variant="secondary" size="sm">Registrarme como profesional</Button>
            </Link>
          </div>
        )}

        <Button variant="secondary" size="lg" block onClick={handleSignOut} style={{ color: "var(--brand-alert)" }}>
          Cerrar sesión
        </Button>
      </main>

      <NavBottom />
    </div>
  );
}
