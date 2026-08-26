"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getAdminUsers, type PaginatedResponse, type UserWithRoles } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/lib/status";
import Button from "@/components/ui/Button";

const ROLE_LABEL: Record<string, string> = {
  client:       "Cliente",
  professional: "Profesional",
  admin:        "Admin",
};

const ROLE_TONE: Record<string, BadgeTone> = {
  client:       "neutral",
  professional: "info",
  admin:        "verif",
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
        <h1 className="serif text-xl font-bold text-ink">Usuarios</h1>
        {data && <p className="text-sm text-ink-soft">{data.total} en total</p>}
      </div>

      <div className="bg-surface-2 rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-3">
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Roles</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-ink-soft uppercase tracking-wide">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">No hay usuarios</td>
              </tr>
            ) : (
              data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-surface-3 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-ink-soft">Sin rol</span>
                      ) : (
                        u.roles.map((r) => (
                          <Badge key={r} tone={ROLE_TONE[r] ?? "neutral"}>
                            {ROLE_LABEL[r] ?? r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.deletedAt ? (
                      <Badge tone="alert">Eliminado</Badge>
                    ) : (
                      <span className="text-xs text-ink-soft">Activo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
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
