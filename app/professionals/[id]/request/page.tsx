"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getProfessional, createRequest, uploadRequestPhoto, listMyAddresses, createMyAddress } from "@/lib/api";
import { Field, Textarea, TextInput } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/icons/Icon";
import LocalPhotoPicker from "@/components/ui/LocalPhotoPicker";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import type { SavedAddress } from "@/lib/types";

export default function RequestPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const id = params.id as string;

  const [professionalName, setProfessionalName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAddressMapOpen, setNewAddressMapOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    getProfessional(id).then((p) => setProfessionalName(p.name)).catch(() => {});
  }, [id]);

  useEffect(() => {
    listMyAddresses(getToken)
      .then((addrs) => {
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) setSelectedAddressId(def.id);
        else setShowAddAddress(true);
      })
      .catch(() => setShowAddAddress(true))
      .finally(() => setAddressesLoading(false));
  }, [getToken]);

  async function handleAddAddress() {
    if (!newLabel.trim() || !newAddress.trim()) return;
    setSavingAddress(true);
    setError("");
    try {
      const created = await createMyAddress({ label: newLabel.trim(), address: newAddress.trim() }, getToken);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewLabel("");
      setNewAddress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el domicilio");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !selectedAddressId) return;
    setLoading(true);
    setError("");
    try {
      const request = await createRequest(id, description.trim(), selectedAddressId, getToken);
      for (const photo of photos) {
        try {
          await uploadRequestPhoto(request.id, photo, getToken);
        } catch {
          // las fotos son una mejora, no bloquean el envío de la solicitud
        }
      }
      router.push("/request-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-page">

      <header className="topbar">
        <div className="topbar__in">
          <Link href={`/professionals/${id}`} className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h1 className="text-base font-semibold text-ink">Solicitar presupuesto</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-32 md:pb-8 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-ink-soft mb-1">Enviando solicitud a</p>
            <p className="text-sm font-semibold text-ink">{professionalName || "…"}</p>
          </div>

          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <span className="field__label block">Domicilio del trabajo</span>

            {addressesLoading ? (
              <div className="h-9 rounded-xl bg-surface-3 animate-pulse" />
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {addresses.map((a) => (
                      <Chip
                        key={a.id}
                        active={selectedAddressId === a.id}
                        onClick={() => { setSelectedAddressId(a.id); setShowAddAddress(false); }}
                      >
                        {a.label}
                      </Chip>
                    ))}
                    <Chip active={showAddAddress} onClick={() => setShowAddAddress((v) => !v)}>
                      + Domicilio nuevo
                    </Chip>
                  </div>
                )}

                {selectedAddressId && !showAddAddress && (
                  <p className="text-xs text-ink-soft">
                    {addresses.find((a) => a.id === selectedAddressId)?.address}
                  </p>
                )}

                {showAddAddress && (
                  <div className="space-y-2 pt-1">
                    <TextInput
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Nombre (ej: Casa, Depto)"
                    />
                    <AddressAutocomplete onSelect={setNewAddress} onUnconfirmedChange={setNewAddressMapOpen} />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddAddress}
                      disabled={savingAddress || !newLabel.trim() || !newAddress.trim() || newAddressMapOpen}
                    >
                      {savingAddress ? "Guardando..." : "Guardar domicilio"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <Field label="Describí el problema o trabajo">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Tengo una pérdida de agua en la cocina, debajo de la bacha..."
                rows={5}
                required
              />
            </Field>
          </div>

          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <span className="field__label block mb-2">Fotos (opcional)</span>
            <LocalPhotoPicker files={photos} onChange={setPhotos} />
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}>
              {error}
            </p>
          )}

          <div className="hidden md:block pt-2">
            <Button type="submit" variant="accent" size="lg" block disabled={!description.trim() || !selectedAddressId || loading}>
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>

        </form>
      </main>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(to top, var(--page), color-mix(in srgb, var(--page) 90%, transparent), transparent)" }}
      >
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || !selectedAddressId || loading}
            variant="accent"
            size="lg"
            block
            className="active:scale-95 transition-transform"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>
      </div>

    </div>
  );
}
