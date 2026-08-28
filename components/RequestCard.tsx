import type { ReactNode } from "react";
import type { Request } from "@/lib/api";
import { StatusBadge } from "@/components/ui/Badge";

interface Props {
  title: string;
  request: Request;
  children?: ReactNode;
}

export default function RequestCard({ title, request, children }: Props) {
  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <StatusBadge status={request.status} />
      </div>

      <p className="text-sm text-ink-mid leading-relaxed">{request.description}</p>

      {request.address && (
        request.addressRevealed ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-soft underline decoration-dotted block"
          >
            Domicilio: {request.address}
          </a>
        ) : (
          // Dirección todavía no revelada: sin link a Google Maps real (una
          // búsqueda a nivel localidad ahí muestra el polígono del barrio
          // entero, no un círculo) — el círculo aproximado se ve al entrar
          // al detalle ("Ver solicitud →"), vía ApproxLocationSection.
          <p className="text-xs text-ink-soft">Domicilio: {request.address}</p>
        )
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

      {children}
    </div>
  );
}
