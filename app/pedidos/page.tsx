"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import RequestCard from "@/components/RequestCard";
import Button from "@/components/ui/Button";
import { getSentRequests, getMyClientStats } from "@/lib/api";
import type { Request } from "@/lib/api";
import type { ClientStats } from "@/lib/types";
import { useActiveRole } from "@/lib/useActiveRole";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const label = new Date(year, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function PedidosPage() {
  const { getToken } = useAuth();
  const { isLoaded } = useUser();
  const { hasClient, hasProfessional, active } = useActiveRole();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (hasProfessional && (!hasClient || active === "professional")) { router.replace("/pro/pedidos"); return; }
    getSentRequests(getToken)
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [isLoaded, hasClient, hasProfessional, active, getToken, router]);

  useEffect(() => {
    getMyClientStats(getToken)
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [getToken]);

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <h2 className="serif text-lg font-bold text-ink pb-2">Mi actividad</h2>

        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-2xl h-20 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm text-center">
                <p className="text-xs text-ink-soft mb-1">Trabajos completados</p>
                <p className="text-lg font-bold text-ink">{stats.totalCompleted}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm text-center">
                <p className="text-xs text-ink-soft mb-1">Total gastado</p>
                <p className="text-lg font-bold text-ink">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>

            {stats.monthlySpending.length > 0 && (
              <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-sm font-semibold text-ink mb-1">Gastos por mes</p>
                {stats.monthlySpending.map((m) => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span className="text-ink-mid">{formatMonthLabel(m.month)}</span>
                    <span className="text-ink font-medium">
                      {formatCurrency(m.amount)} · {m.jobsCount} trabajo{m.jobsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wide pt-2 pb-2">Historial de pedidos</h3>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm animate-pulse h-24" />
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="bg-surface-2 border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <p className="text-sm font-medium text-ink">No enviaste solicitudes aún</p>
            <p className="text-xs text-ink-soft mt-1">Buscá un profesional y contactalo</p>
            <Link href="/" className="mt-4">
              <Button variant="secondary" size="sm">Ver profesionales →</Button>
            </Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.id} title={req.professionalName} request={req}>
                {req.status === "accepted" && req.jobId && (
                  <Link href={`/jobs/${req.jobId}`} className="block">
                    <Button variant="secondary" size="sm" block>Ver trabajo →</Button>
                  </Link>
                )}
              </RequestCard>
            ))}
          </div>
        )}
      </main>

      <NavBottom />
    </div>
  );
}
