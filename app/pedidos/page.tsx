"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import RequestCard from "@/components/RequestCard";
import Button from "@/components/ui/Button";
import { getSentRequests } from "@/lib/api";
import type { Request } from "@/lib/api";

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
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <h2 className="serif text-lg font-bold text-ink">Mis pedidos</h2>

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
