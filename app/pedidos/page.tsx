"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    const roles = user?.unsafeMetadata?.roles as string[] | undefined;
    if (roles?.includes("professional")) { router.replace("/pro/pedidos"); return; }
    getSentRequests(getToken)
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [isLoaded, user, getToken, router]);

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
            <Link href="/" className="mt-4 text-sm font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5 transition-colors">
              Ver profesionales →
            </Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{req.professionalName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[req.status]}`}>
                    {statusLabel[req.status]}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{req.description}</p>
                {req.status === "rejected" && req.rejectionReason && (
                  <div className="bg-red-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-red-600 mb-0.5">Motivo del rechazo</p>
                    <p className="text-xs text-red-500">{req.rejectionReason}</p>
                  </div>
                )}
                <p className="text-xs text-muted">
                  {new Date(req.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                {req.status === "accepted" && req.jobId && (
                  <Link href={`/jobs/${req.jobId}`}
                    className="block text-center text-xs font-semibold py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
                    Ver trabajo →
                  </Link>
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
