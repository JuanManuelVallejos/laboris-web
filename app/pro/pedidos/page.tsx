"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import { getReceivedRequests, updateRequestStatus } from "@/lib/api";
import type { Request } from "@/lib/api";

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

function sortRequests(reqs: Request[]): Request[] {
  return [...reqs].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function ProPedidosPage() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason]     = useState("");
  const [error, setError]       = useState("");

  useEffect(() => {
    getReceivedRequests(getToken)
      .then((reqs) => setRequests(sortRequests(reqs)))
      .finally(() => setLoading(false));
  }, [getToken]);

  async function handleAccept(id: string) {
    setUpdating(id); setError("");
    try {
      await updateRequestStatus(id, "accepted", getToken);
      setRequests((prev) => sortRequests(prev.map((r) => r.id === id ? { ...r, status: "accepted" as const } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aceptar");
    } finally { setUpdating(null); }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) return;
    setUpdating(id); setError("");
    try {
      await updateRequestStatus(id, "rejected", getToken, reason.trim());
      setRequests((prev) => sortRequests(prev.map((r) => r.id === id ? { ...r, status: "rejected" as const, rejectionReason: reason.trim() } : r)));
      setRejectingId(null); setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al rechazar");
    } finally { setUpdating(null); }
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/pro" className="text-primary font-medium text-sm">←</Link>
          <h2 className="text-lg font-bold text-ink">Historial de pedidos</h2>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-surface rounded-2xl p-4 shadow-sm animate-pulse h-24" />)}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="bg-surface rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm font-medium text-ink">No tenés pedidos aún</p>
            <p className="text-xs text-muted mt-1">Cuando alguien te contacte, aparecerá acá</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface rounded-2xl p-4 shadow-sm space-y-2">
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
                    <button onClick={() => handleAccept(req.id)} disabled={updating === req.id}
                      className="flex-1 text-xs font-semibold py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {updating === req.id ? "..." : "Aceptar"}
                    </button>
                    <button onClick={() => { setRejectingId(req.id); setReason(""); }} disabled={updating === req.id}
                      className="flex-1 text-xs font-semibold py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                      Rechazar
                    </button>
                  </div>
                )}

                {req.status === "pending" && rejectingId === req.id && (
                  <div className="space-y-2 pt-1">
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="Motivo del rechazo (obligatorio)" rows={2}
                      className="w-full text-xs text-ink placeholder:text-muted bg-cream rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 border border-red-200 transition" />
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(req.id)} disabled={!reason.trim() || updating === req.id}
                        className="flex-1 text-xs font-semibold py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors">
                        {updating === req.id ? "..." : "Confirmar rechazo"}
                      </button>
                      <button onClick={() => { setRejectingId(null); setReason(""); }}
                        className="text-xs font-semibold py-2 px-3 rounded-xl border border-border text-muted hover:bg-cream transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <NavBottom />
    </div>
  );
}
