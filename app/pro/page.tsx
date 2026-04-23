"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import { getMyProfessional } from "@/lib/api";
import type { Professional } from "@/lib/types";

export default function ProDashboard() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProfessional(getToken)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [getToken]);

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
        <h2 className="text-lg font-bold text-ink">Mi panel</h2>

        {loading && (
          <div className="bg-surface rounded-2xl p-6 shadow-sm animate-pulse h-32" />
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {profile && (
          <div className="bg-surface rounded-2xl p-4 shadow-sm flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-base">{profile.name}</p>
              <p className="text-sm text-muted mt-0.5 capitalize">
                {profile.trade} · {profile.zone}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-amber-500 font-medium">
                  ★ {profile.rating > 0 ? profile.rating.toFixed(1) : "Sin reviews"}
                </span>
                {profile.verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Verificado
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-sm text-muted mt-2 line-clamp-2">{profile.bio}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-surface rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-ink text-sm mb-3">Solicitudes recibidas</h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm font-medium text-ink">No tenés solicitudes aún</p>
            <p className="text-xs text-muted mt-1">Cuando alguien te contacte, aparecerá acá</p>
          </div>
        </div>
      </main>

      <NavBottom />
    </div>
  );
}
