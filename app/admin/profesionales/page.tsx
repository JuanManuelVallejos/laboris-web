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
        <h1 className="text-xl font-bold text-ink">Profesionales</h1>
        {data && (
          <p className="text-sm text-muted">{data.total} en total</p>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Oficio</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Zona</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Rating</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Verificado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">No hay profesionales</td>
              </tr>
            ) : (
              data?.items.map((p) => {
                const busy = actionLoading === p.id;
                return (
                  <tr key={p.id} className={`transition-colors ${p.status === "suspended" ? "bg-red-50/50" : "hover:bg-cream/50"}`}>
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-muted capitalize">{p.trade}</td>
                    <td className="px-4 py-3 text-muted">{p.zone}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.rating > 0 ? `★ ${p.rating.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {p.status === "active" ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.verified
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {p.verified ? "✓ Verificado" : "Sin verificar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVerify(p)}
                          disabled={busy}
                          className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-cream transition-colors disabled:opacity-50"
                        >
                          {p.verified ? "Desverificar" : "Verificar"}
                        </button>
                        <button
                          onClick={() => toggleStatus(p)}
                          disabled={busy}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                            p.status === "active"
                              ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {p.status === "active" ? "Suspender" : "Reactivar"}
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={busy}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                            deleteConfirm === p.id
                              ? "border-red-400 bg-red-500 text-white"
                              : "border-red-200 text-red-500 hover:bg-red-50"
                          }`}
                        >
                          {deleteConfirm === p.id ? "¿Confirmar?" : "Eliminar"}
                        </button>
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
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-xl border border-border bg-surface hover:bg-cream disabled:opacity-40 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-muted">
            Página {page} de {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 text-sm rounded-xl border border-border bg-surface hover:bg-cream disabled:opacity-40 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
