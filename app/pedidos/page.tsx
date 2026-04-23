"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import { getSentRequests } from "@/lib/api";
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

export default function PedidosPage() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSentRequests(getToken)
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [getToken]);

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
        <h2 className="text-lg font-bold text-ink">Mis pedidos</h2>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 shadow-sm animate-pulse h-24" />
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="bg-surface rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <span className="text-3xl mb-2">📋</span>
            <p className="text-sm font-medium text-ink">No enviaste solicitudes aún</p>
            <p className="text-xs text-muted mt-1">Buscá un profesional y contactalo</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink capitalize">{req.professionalId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[req.status]}`}>
                    {statusLabel[req.status]}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{req.description}</p>
                <p className="text-xs text-muted">{new Date(req.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <NavBottom />
    </div>
  );
}
