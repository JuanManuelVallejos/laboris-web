"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getAdminProfessionals,
  adminVerifyProfessional,
  adminSetProfessionalStatus,
  adminDeleteProfessional,
  type PaginatedResponse,
} from "@/lib/api";
import type { Professional } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminProfesionalesPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Professional> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAdminProfessionals(page, getToken)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, getToken]);

  useEffect(() => { load(); }, [load]);

  const withAction = async (id: string, fn: () => Promise<void>) => {
    setActionLoading(id);
    try { await fn(); await load(); } finally { setActionLoading(null); }
  };

  const toggleVerify = (p: Professional) =>
    withAction(p.id, () => adminVerifyProfessional(p.id, !p.verified, getToken));

  const toggleStatus = (p: Professional) =>
    withAction(p.id, () =>
      adminSetProfessionalStatus(p.id, p.status === "active" ? "suspended" : "active", getToken)
    );

  const handleDelete = (p: Professional) => {
    if (deleteConfirm === p.id) {
      withAction(p.id, () => adminDeleteProfessional(p.id, getToken));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(p.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="serif text-xl font-bold text-ink">Profesionales</h1>
        {data && (
          <p className="text-sm text-ink-soft">{data.total} en total</p>
        )}
      </div>

      <div className="bg-surface-2 rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-3">
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Oficio</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Zona</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Rating</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Verificado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">No hay profesionales</td>
              </tr>
            ) : (
              data?.items.map((p) => {
                const busy = actionLoading === p.id;
                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-surface-3"
                    style={p.status === "suspended" ? { background: "color-mix(in srgb, var(--brand-alert) 6%, transparent)" } : undefined}
                  >
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-soft capitalize">{p.trade}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.zone}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.rating > 0 ? `★ ${p.rating.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === "active" ? "verif" : "alert"}>
                        {p.status === "active" ? "Activo" : "Suspendido"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.verified ? "verif" : "neutral"}>
                        {p.verified ? "✓ Verificado" : "Sin verificar"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => toggleVerify(p)} disabled={busy}>
                          {p.verified ? "Desverificar" : "Verificar"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toggleStatus(p)} disabled={busy}>
                          {p.status === "active" ? "Suspender" : "Reactivar"}
                        </Button>
                        <Button
                          variant={deleteConfirm === p.id ? "alert" : "secondary"}
                          size="sm"
                          onClick={() => handleDelete(p)}
                          disabled={busy}
                        >
                          {deleteConfirm === p.id ? "¿Confirmar?" : "Eliminar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Anterior
          </Button>
          <span className="text-sm text-ink-soft">
            Página {page} de {data.totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}
