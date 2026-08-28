"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import RequestCard from "@/components/RequestCard";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getReceivedRequests, listMyJobs } from "@/lib/api";
import type { Request } from "@/lib/api";
import type { Job } from "@/lib/types";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/lib/status";

const FINAL_STATUSES = new Set(["completed", "cancelled"]);

export default function ProDashboard() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getReceivedRequests(getToken).catch(() => []),
      listMyJobs(getToken).catch(() => []),
    ]).then(([reqs, jbs]) => {
      setRequests(reqs as Request[]);
      setJobs(jbs);
    }).finally(() => setLoading(false));
  }, [getToken]);

  const pending = requests.filter((r) => r.status === "pending" || r.status === "viewed");
  const inProgress = jobs.filter((j) => !FINAL_STATUSES.has(j.status));

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <h2 className="serif text-lg font-bold text-ink pb-2">Mi panel</h2>

        {loading && (
          <div className="space-y-4">
            <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm animate-pulse h-32" />
            <div className="bg-surface-2 border border-border rounded-2xl p-6 shadow-sm animate-pulse h-32" />
          </div>
        )}

        {/* Solicitudes */}
        {!loading && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <div className="sec-head mb-3">
              <span className="sec-title" style={{ fontSize: "var(--t-sm)" }}>
                Solicitudes
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

        {/* Trabajos en curso */}
        {!loading && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm">
            <div className="sec-head mb-3">
              <span className="sec-title" style={{ fontSize: "var(--t-sm)" }}>
                Trabajos en curso
                {inProgress.length > 0 && (
                  <Badge tone="neutral" className="ml-2">{inProgress.length}</Badge>
                )}
              </span>
            </div>

            {inProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-ink">No tenés trabajos en curso</p>
                <p className="text-xs text-ink-soft mt-1">Cuando aceptes una solicitud, aparecerá acá</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgress.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                    <div className="border border-border rounded-xl p-3 space-y-2 hover:bg-surface-3 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{job.clientName}</p>
                        <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
                      </div>
                    </div>
                  </Link>
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
