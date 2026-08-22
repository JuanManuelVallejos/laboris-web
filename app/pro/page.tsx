"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import RequestCard from "@/components/RequestCard";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getMyProfessional, getReceivedRequests } from "@/lib/api";
import type { Request } from "@/lib/api";
import type { Professional } from "@/lib/types";

export default function ProDashboard() {
  const { getToken } = useAuth();
  const [profile, setProfile]           = useState<Professional | null>(null);
  const [requests, setRequests]         = useState<Request[]>([]);
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      getMyProfessional(getToken).catch((e) => { setProfileError(e.message); return null; }),
      getReceivedRequests(getToken).catch(() => []),
    ]).then(([prof, reqs]) => {
      if (prof) setProfile(prof);
      setRequests(reqs as Request[]);
    }).finally(() => setLoading(false));
  }, [getToken]);

  const pending = requests.filter((r) => r.status === "pending" || r.status === "viewed");

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <h2 className="serif text-lg font-bold text-ink">Mi panel</h2>

        {loading && (
          <div className="space-y-4">
            <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm animate-pulse h-32" />
            <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm animate-pulse h-48" />
          </div>
        )}

        {/* Perfil */}
        {!loading && profileError && (
          <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm text-center space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--brand-alert)" }}>{profileError}</p>
            <p className="text-xs text-ink-soft">Tu perfil profesional no se encuentra en la base de datos.</p>
            <Link href="/onboarding/professional">
              <Button variant="secondary" size="sm">Completar perfil →</Button>
            </Link>
          </div>
        )}

        {!loading && profile && (
          <div className="pro-card w-full">
            <div className="flex items-start gap-4">
              <div className="pro-av" style={{ width: 56, height: 56, fontSize: "var(--t-h3)" }}>
                {profile.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="pro-name whitespace-normal">{profile.name}</p>
                <p className="pro-role capitalize">{profile.trade} · {profile.zone}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span style={{ color: "var(--amber)", fontSize: "var(--t-sm)", fontWeight: "var(--fw-med)" }}>
                    ★ {profile.rating > 0 ? profile.rating.toFixed(1) : "Sin reviews"}
                  </span>
                  {profile.verified && <Badge tone="verif">Verificado</Badge>}
                </div>
                {profile.bio && <p className="text-sm text-ink-mid mt-2 line-clamp-2">{profile.bio}</p>}
                <Link href="/pro/edit" className="mt-3 inline-block">
                  <Button variant="secondary" size="sm">Editar perfil →</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Solicitudes */}
        {!loading && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <div className="sec-head mb-3">
              <span className="sec-title" style={{ fontSize: "var(--t-sm)" }}>
                Pedidos pendientes
                {pending.length > 0 && (
                  <Badge tone="neutral" className="ml-2">{pending.length}</Badge>
                )}
              </span>
              {requests.length > 0 && (
                <Link href="/pro/pedidos" className="sec-link">
                  Ver historial →
                </Link>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-ink">No tenés solicitudes aún</p>
                <p className="text-xs text-ink-soft mt-1">Cuando alguien te contacte, aparecerá acá</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((req) => (
                  <RequestCard key={req.id} title={req.clientName} request={req}>
                    <Link href={`/pro/pedidos/${req.id}`} className="block">
                      <Button variant="deep" size="sm" block>Ver solicitud →</Button>
                    </Link>
                  </RequestCard>
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
