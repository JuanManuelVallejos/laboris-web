"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import { getMyProfessional, getReceivedRequests, updateRequestStatus } from "@/lib/api";
import type { Request } from "@/lib/api";
import type { Professional } from "@/lib/types";

const statusLabel: Record<string, string> = {
  pending:  "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

const statusColor: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

export default function ProDashboard() {
  const { getToken } = useAuth();
  const [profile, setProfile]           = useState<Professional | null>(null);
  const [requests, setRequests]         = useState<Request[]>([]);
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState<string | null>(null);
  const [actionError, setActionError]   = useState("");
  const [rejectingId, setRejectingId]   = useState<string | null>(null);
  const [reason, setReason]             = useState("");

  useEffect(() => {
    Promise.all([
      getMyProfessional(getToken).catch((e) => { setProfileError(e.message); return null; }),
      getReceivedRequests(getToken).catch(() => []),
    ]).then(([prof, reqs]) => {
      if (prof) setProfile(prof);
      setRequests(reqs as Request[]);
    }).finally(() => setLoading(false));
  }, [getToken]);

  async function handleAccept(id: string) {
    setUpdating(id);
    setActionError("");
    try {
      await updateRequestStatus(id, "accepted", getToken);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "accepted" as const } : r));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al aceptar");
    } finally {
      setUpdating(null);
    }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) return;
    setUpdating(id);
    setActionError("");
    try {
      await updateRequestStatus(id, "rejected", getToken, reason.trim());
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" as const, rejectionReason: reason.trim() } : r));
      setRejectingId(null);
      setReason("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al rechazar");
    } finally {
      setUpdating(null);
    }
  }

  function startRejecting(id: string) {
    setRejectingId(id);
    setReason("");
  }

  function cancelRejecting() {
    setRejectingId(null);
    setReason("");
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
        <h2 className="text-lg font-bold text-ink">Mi panel</h2>

        {actionError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{actionError}</p>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-6 shadow-sm animate-pulse h-32" />
            <div className="bg-surface rounded-2xl p-6 shadow-sm animate-pulse h-48" />
          </div>
        )}

        {/* Perfil */}
        {!loading && profileError && (
          <div className="bg-surface rounded-2xl p-6 shadow-sm text-center space-y-3">
            <p className="text-sm text-red-600 font-medium">{profileError}</p>
            <p className="text-xs text-muted">Tu perfil profesional no se encuentra en la base de datos.</p>
            <Link href="/onboarding/professional" className="inline-block text-sm font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5 transition-colors">
              Completar perfil →
            </Link>
          </div>
        )}

        {!loading && profile && (
          <div className="bg-surface rounded-2xl p-4 shadow-sm flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">👤</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-base">{profile.name}</p>
              <p className="text-sm text-muted mt-0.5 capitalize">{profile.trade} · {profile.zone}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-amber-500 font-medium">
                  ★ {profile.rating > 0 ? profile.rating.toFixed(1) : "Sin reviews"}
                </span>
                {profile.verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verificado</span>
                )}
              </div>
              {profile.bio && <p className="text-sm text-muted mt-2 line-clamp-2">{profile.bio}</p>}
              <Link href="/pro/edit" className="mt-3 inline-block text-xs font-semibold text-primary border border-primary/30 rounded-xl px-3 py-1.5 hover:bg-primary/5 transition-colors">
                Editar perfil →
              </Link>
            </div>
          </div>
        )}

        {/* Solicitudes */}
        {!loading && (
          <div className="bg-surface rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-ink text-sm mb-3">
              Solicitudes recibidas
              {requests.length > 0 && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{requests.length}</span>
              )}
            </h3>

            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-3xl mb-2">📭</span>
                <p className="text-sm font-medium text-ink">No tenés solicitudes aún</p>
                <p className="text-xs text-muted mt-1">Cuando alguien te contacte, aparecerá acá</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{req.clientName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[req.status]}`}>
                        {statusLabel[req.status]}
                      </span>
                    </div>

                    <p className="text-sm text-muted leading-relaxed">{req.description}</p>

                    {req.status === "rejected" && req.rejectionReason && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        Motivo: {req.rejectionReason}
                      </p>
                    )}

                    <p className="text-xs text-muted">
                      {new Date(req.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    {req.status === "pending" && rejectingId !== req.id && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={updating === req.id}
                          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {updating === req.id ? "..." : "Aceptar"}
                        </button>
                        <button
                          onClick={() => startRejecting(req.id)}
                          disabled={updating === req.id}
                          className="flex-1 text-xs font-semibold py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {req.status === "pending" && rejectingId === req.id && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Motivo del rechazo (obligatorio)"
                          rows={2}
                          className="w-full text-xs text-ink placeholder:text-muted bg-cream rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 border border-red-200 transition"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={!reason.trim() || updating === req.id}
                            className="flex-1 text-xs font-semibold py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
                          >
                            {updating === req.id ? "..." : "Confirmar rechazo"}
                          </button>
                          <button
                            onClick={cancelRejecting}
                            className="text-xs font-semibold py-2 px-3 rounded-xl border border-border text-muted hover:bg-cream transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <NavBottom />
    </div>
  );
}
