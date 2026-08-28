"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import RequestCard from "@/components/RequestCard";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import { getReceivedRequests, getMyProfessionalStats } from "@/lib/api";
import type { Request } from "@/lib/api";
import type { ProfessionalStats } from "@/lib/types";

function sortRequests(reqs: Request[]): Request[] {
  return [...reqs].sort((a, b) => {
    const aActive = a.status === "pending" || a.status === "viewed";
    const bActive = b.status === "pending" || b.status === "viewed";
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const label = new Date(year, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ProPedidosPage() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getReceivedRequests(getToken)
      .then((reqs) => setRequests(sortRequests(reqs)))
      .finally(() => setLoading(false));
  }, [getToken]);

  useEffect(() => {
    getMyProfessionalStats(getToken)
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [getToken]);

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <Link href="/pro" className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h2 className="serif text-lg font-bold text-ink">Mi actividad</h2>
        </div>

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
                <p className="text-xs text-ink-soft mb-1">Total ganado</p>
                <p className="text-lg font-bold text-ink">{formatCurrency(stats.totalEarned)}</p>
              </div>
            </div>

            {stats.monthlyEarnings.length > 0 && (
              <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-sm font-semibold text-ink mb-1">Ganancias por mes</p>
                {stats.monthlyEarnings.map((m) => (
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm animate-pulse h-24" />
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="bg-surface-2 border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <p className="text-sm font-medium text-ink">No tenés pedidos aún</p>
            <p className="text-xs text-ink-soft mt-1">Cuando alguien te contacte, aparecerá acá</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.id} title={req.clientName} request={req}>
                {req.status === "accepted" && req.jobId && (
                  <Link href={`/jobs/${req.jobId}`} className="block">
                    <Button variant="secondary" size="sm" block>Ver trabajo →</Button>
                  </Link>
                )}
                {(req.status === "pending" || req.status === "viewed") && (
                  <Link href={`/pro/pedidos/${req.id}`} className="block">
                    <Button variant="deep" size="sm" block>Ver solicitud →</Button>
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
