"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import RequestCard from "@/components/RequestCard";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import { getReceivedRequests } from "@/lib/api";
import type { Request } from "@/lib/api";

function sortRequests(reqs: Request[]): Request[] {
  return [...reqs].sort((a, b) => {
    const aActive = a.status === "pending" || a.status === "viewed";
    const bActive = b.status === "pending" || b.status === "viewed";
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function ProPedidosPage() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getReceivedRequests(getToken)
      .then((reqs) => setRequests(sortRequests(reqs)))
      .finally(() => setLoading(false));
  }, [getToken]);

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/pro" className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h2 className="serif text-lg font-bold text-ink">Historial de pedidos</h2>
        </div>

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
