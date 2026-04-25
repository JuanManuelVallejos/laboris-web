"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getAdminUsers, type PaginatedResponse, type UserWithRoles } from "@/lib/api";

const roleLabel: Record<string, string> = {
  client:       "Cliente",
  professional: "Profesional",
  admin:        "Admin",
};

const roleBadge: Record<string, string> = {
  client:       "bg-gray-100 text-gray-600",
  professional: "bg-blue-100 text-blue-700",
  admin:        "bg-purple-100 text-purple-700",
};

export default function AdminUsuariosPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<PaginatedResponse<UserWithRoles> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getAdminUsers(page, getToken)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, getToken]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">Usuarios</h1>
        {data && <p className="text-sm text-muted">{data.total} en total</p>}
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Roles</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">No hay usuarios</td>
              </tr>
            ) : (
              data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-muted">Sin rol</span>
                      ) : (
                        u.roles.map((r) => (
                          <span
                            key={r}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[r] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {roleLabel[r] ?? r}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(u.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
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
