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
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import {
  getMyProfessional,
  completeOnboarding,
  listMyAddresses,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  setDefaultAddress,
} from "@/lib/api";
import type { Professional, SavedAddress } from "@/lib/types";
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

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [busyAddressId, setBusyAddressId] = useState<string | null>(null);

  const isPro = active === "professional";

  useEffect(() => {
    if (!isLoaded || !isPro) { setProLoading(false); return; }
    getMyProfessional(getToken)
      .then(setProProfile)
      .catch((e) => setProfileError(e.message))
      .finally(() => setProLoading(false));
  }, [isLoaded, isPro, getToken]);

  useEffect(() => {
    if (!isLoaded || isPro) { setAddressesLoading(false); return; }
    listMyAddresses(getToken)
      .then(setAddresses)
      .catch((e) => setAddressError(e instanceof Error ? e.message : "Error al cargar tus domicilios"))
      .finally(() => setAddressesLoading(false));
  }, [isLoaded, isPro, getToken]);

  async function handleAddAddress() {
    if (!addLabel.trim() || !addAddress.trim()) return;
    setSavingAddress(true);
    setAddressError("");
    try {
      const created = await createMyAddress({ label: addLabel.trim(), address: addAddress.trim() }, getToken);
      setAddresses((prev) => [...prev, created].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)));
      setShowAddForm(false);
      setAddLabel("");
      setAddAddress("");
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "No se pudo agregar el domicilio");
    } finally {
      setSavingAddress(false);
    }
  }

  function startEditAddress(a: SavedAddress) {
    setEditingId(a.id);
    setEditLabel(a.label);
    setEditAddress(a.address);
    setAddressError("");
  }

  async function handleSaveEditAddress(id: string) {
    if (!editLabel.trim() || !editAddress.trim()) return;
    setBusyAddressId(id);
    setAddressError("");
    try {
      const updated = await updateMyAddress(id, { label: editLabel.trim(), address: editAddress.trim() }, getToken);
      setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditingId(null);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "No se pudo editar el domicilio");
    } finally {
      setBusyAddressId(null);
    }
  }

  async function handleDeleteAddress(id: string) {
    setBusyAddressId(id);
    setAddressError("");
    try {
      await deleteMyAddress(id, getToken);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "No se pudo eliminar el domicilio");
    } finally {
      setBusyAddressId(null);
    }
  }

  async function handleSetDefaultAddress(id: string) {
    setBusyAddressId(id);
    setAddressError("");
    try {
      await setDefaultAddress(id, getToken);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "No se pudo marcar como predeterminado");
    } finally {
      setBusyAddressId(null);
    }
  }

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

        {/* Mis domicilios (cliente) */}
        {!isPro && (
          <div className="bg-surface-2 border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-ink">Mis domicilios</h3>

            {addressesLoading ? (
              <div className="h-16 rounded-xl bg-surface-3 animate-pulse" />
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <div key={a.id} className="rounded-xl border border-border p-3">
                    {editingId === a.id ? (
                      <div className="space-y-2">
                        <TextInput
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Nombre (ej: Casa)"
                        />
                        <AddressAutocomplete currentValue={editAddress} onSelect={setEditAddress} />
                        <div className="flex gap-2">
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleSaveEditAddress(a.id)}
                            disabled={busyAddressId === a.id || !editLabel.trim() || !editAddress.trim()}
                          >
                            {busyAddressId === a.id ? "Guardando..." : "Guardar"}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-ink">{a.label}</p>
                            {a.isDefault && <Badge tone="verif">Predeterminado</Badge>}
                          </div>
                          <p className="text-xs text-ink-soft mt-0.5">{a.address}</p>
                          {a.hasActiveJob && (
                            <p className="text-xs mt-1" style={{ color: "var(--brand-alert)" }}>
                              Tiene un trabajo en curso — no se puede editar ni borrar
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs font-medium text-brand-vivid disabled:opacity-40"
                              disabled={a.hasActiveJob}
                              onClick={() => startEditAddress(a)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="text-xs font-medium disabled:opacity-40"
                              style={{ color: "var(--brand-alert)" }}
                              disabled={a.hasActiveJob || busyAddressId === a.id}
                              onClick={() => handleDeleteAddress(a.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                          {!a.isDefault && (
                            <button
                              type="button"
                              className="text-xs font-medium text-ink-soft disabled:opacity-40"
                              disabled={busyAddressId === a.id}
                              onClick={() => handleSetDefaultAddress(a.id)}
                            >
                              Marcar como predeterminado
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {addresses.length === 0 && !showAddForm && (
                  <p className="text-xs text-ink-soft">Todavía no cargaste ningún domicilio.</p>
                )}
              </div>
            )}

            {addressError && (
              <p className="text-xs" style={{ color: "var(--brand-alert)" }}>{addressError}</p>
            )}

            {showAddForm ? (
              <div className="space-y-2 pt-1">
                <TextInput
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                  placeholder="Nombre (ej: Casa, Depto)"
                />
                <AddressAutocomplete onSelect={setAddAddress} />
                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleAddAddress}
                    disabled={savingAddress || !addLabel.trim() || !addAddress.trim()}
                  >
                    {savingAddress ? "Guardando..." : "Guardar domicilio"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setShowAddForm(false); setAddLabel(""); setAddAddress(""); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
                + Agregar domicilio
              </Button>
            )}
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
              <AddressAutocomplete onSelect={setNewClientAddress} />
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
