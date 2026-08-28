"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import PhotoGallery from "@/components/ui/PhotoGallery";
import { AcceptRejectRow, RejectForm } from "@/components/RequestActions";
import ApproxLocationSection from "@/components/ApproxLocationSection";
import { getRequestDetail, updateRequestStatus } from "@/lib/api";
import type { Request } from "@/lib/api";

export default function ProRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    getRequestDetail(id, getToken)
      .then(setRequest)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Error al cargar la solicitud"))
      .finally(() => setLoading(false));
  }, [id, getToken]);

  async function handleAccept() {
    setUpdating(true);
    setActionError("");
    try {
      const updated = await updateRequestStatus(id, "accepted", getToken);
      if (updated.jobId) {
        router.push(`/jobs/${updated.jobId}`);
      } else {
        router.push("/pro/pedidos");
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al aceptar");
      setUpdating(false);
    }
  }

  async function handleReject(reason: string) {
    setUpdating(true);
    setActionError("");
    try {
      await updateRequestStatus(id, "rejected", getToken, reason);
      router.push("/pro/pedidos");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al rechazar");
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/pro/pedidos" className="text-brand-vivid" aria-label="Volver">
            <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 18, height: 18 }} />
          </Link>
          <h2 className="serif text-lg font-bold text-ink">Solicitud</h2>
        </div>

        {loading && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm animate-pulse h-40" />
        )}

        {!loading && loadError && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}>
            {loadError}
          </p>
        )}

        {!loading && request && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{request.clientName}</p>
              <StatusBadge status={request.status} />
            </div>

            <p className="text-sm text-ink-mid leading-relaxed">{request.description}</p>

            {request.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ink-soft underline decoration-dotted block"
              >
                Domicilio: {request.address}
              </a>
            )}

            {request.address && !request.addressRevealed && (
              <ApproxLocationSection requestId={request.id} />
            )}

            {request.photos && request.photos.length > 0 && (
              <PhotoGallery photos={request.photos} />
            )}

            {request.status === "rejected" && request.rejectionReason && (
              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{ background: "color-mix(in srgb, var(--brand-alert) 10%, transparent)", color: "var(--brand-alert)" }}
              >
                Motivo: {request.rejectionReason}
              </p>
            )}

            <p className="text-xs text-ink-soft">
              {new Date(request.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            {actionError && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)", color: "var(--brand-alert)" }}>
                {actionError}
              </p>
            )}

            {request.status === "accepted" && request.jobId && (
              <Link href={`/jobs/${request.jobId}`} className="block">
                <Button variant="secondary" size="sm" block>Ver trabajo →</Button>
              </Link>
            )}

            {(request.status === "pending" || request.status === "viewed") && !rejecting && (
              <AcceptRejectRow
                onAccept={handleAccept}
                onReject={() => setRejecting(true)}
                loading={updating}
              />
            )}

            {(request.status === "pending" || request.status === "viewed") && rejecting && (
              <RejectForm
                onConfirm={handleReject}
                onCancel={() => setRejecting(false)}
                loading={updating}
              />
            )}
          </div>
        )}
      </main>

      <NavBottom />
    </div>
  );
}
